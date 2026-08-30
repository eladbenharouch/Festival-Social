const navLinks = document.getElementById('navLinks');
const content = document.getElementById('content');

let currentUser = null;
let followingIds = new Set();
let lastPosts = [];
let editingPostId = null;
let toastTimer = null;
let lastSearchResults = [];
let searchCoords = null;
let postCoords = null;

async function init()
{
  const result = await getCurrentUser();
  const user = result && result.user ? result.user : null;

  renderNav(navLinks, user, 'home');

  if (user)
  {
    currentUser = user;
    await renderLoggedIn();
  }
  else
  {
    renderLoggedOut();
  }
}

function renderLoggedOut()
{
  content.innerHTML = `
    <h1>Find your next festival</h1>
    <p class="subtitle">Share experiences, join groups, get live updates from the crowd.</p>
    <a href="/register.html" class="primary-btn" style="display:block; text-align:center; text-decoration:none; margin-top:1.5rem;">Get Started</a>
  `;
}

async function renderLoggedIn()
{
  document.querySelector('main').classList.add('top-align');
  content.classList.remove('card');
  content.classList.add('page-container');

  content.innerHTML = `
    <section class="card-flat">
      <h2>Share something</h2>
      <p class="error-message" id="createError"></p>
      <form id="createPostForm" class="inline-form">
        <div class="field">
          <label for="postTitle">Title</label>
          <input type="text" id="postTitle" required maxlength="120" placeholder="What's going on?">
        </div>
        <div class="field">
          <label for="postGenre">Genre</label>
          <input type="text" id="postGenre" maxlength="40" placeholder="Optional">
        </div>
        <div class="field">
          <label for="postGroup">Group</label>
          <select id="postGroup"><option value="">No group</option></select>
        </div>
        <div class="field">
          <label for="postMediaUrl">Media URL</label>
          <input type="text" id="postMediaUrl" maxlength="500" placeholder="Optional link">
        </div>
        <div class="field" style="flex-basis:100%;">
                <div class="field" style="flex-basis:100%;">
          <label>Location</label>
          <button type="button" id="usePostLocation" class="btn-small btn-outline">Use my location</button>
          <span id="postLocationStatus"></span>
        </div>
          <label for="postContent">Content</label>
          <textarea id="postContent" required maxlength="3000" rows="3"></textarea>
        </div>
        <label class="checkbox-field"><input type="checkbox" id="postIsLive"> This is a live crowd update</label>
        <button type="submit" class="primary-btn btn-small">Post</button>
      </form>
    </section>
      <section>
      <h2>Your Feed</h2>
      <div class="posts-list" id="feedList"></div>
    </section>
    <section class="card-flat">
      <h2>Search Posts</h2>
      <form id="postSearchForm" class="inline-form">
        <div class="field">
          <label for="searchGenre">Genre</label>
          <input type="text" id="searchGenre" maxlength="40" placeholder="Any genre">
        </div>
        <div class="field">
          <label for="searchIsLive">Live status</label>
          <select id="searchIsLive">
            <option value="">All posts</option>
            <option value="true">Live only</option>
            <option value="false">Non-live only</option>
          </select>
        </div>
        <label class="checkbox-field"><input type="checkbox" id="searchNearMe"> Near my location</label>
        <button type="submit" class="primary-btn btn-small">Search</button>
      </form>
      <p class="error-message" id="searchError"></p>
      <div class="posts-list" id="searchResultsList"></div>
    </section>
  `;

  setupCreateForm();
  setupPostSearch();

  await Promise.all([loadMyGroupsForSelect(), loadFollowing()]);
  await loadFeed();
}

async function loadMyGroupsForSelect()
{
  try
  {
    const { groups } = await apiRequest('/api/groups/mine');
    const select = document.getElementById('postGroup');

    groups.forEach((group) =>
    {
      const option = document.createElement('option');
      option.value = group._id;
      option.textContent = group.name;
      select.appendChild(option);
    });
  }
  catch (err)
  {
    showToast(err.message, 'error');
  }
}

async function loadFollowing()
{
  try
  {
    const { following } = await apiRequest('/api/users/following');
    followingIds = new Set(following.map((id) => id.toString()));
  }
  catch (err)
  {
    showToast(err.message, 'error');
  }
}

async function loadFeed()
{
  try
  {
    const { posts } = await apiRequest('/api/posts/feed');
    lastPosts = posts;
    renderPostsList();
  }
  catch (err)
  {
    showToast(err.message, 'error');
  }
}

function renderPostsList()
{
  const container = document.getElementById('feedList');

  if (!lastPosts.length)
  {
    container.innerHTML = '<p class="empty-message">Your feed is empty. Join a group, follow someone, or share your first post.</p>';
    return;
  }

  container.innerHTML = lastPosts.map((post) => postCardHtml(post)).join('');

  lastPosts.forEach((post) =>
  {
    if (post._id === editingPostId)
    {
      wireEditForm(post);
      return;
    }

    wireDisplayCard(post);
  });
}

function postCardHtml(post)
{
  if (post._id === editingPostId)
  {
    return editCardHtml(post);
  }

  const isOwnPost = post.author._id === currentUser.id;
  const isFollowingAuthor = followingIds.has(post.author._id);
  const isLiked = post.likedBy.some((userId) => userId === currentUser.id);

  const groupBadge = post.group ? `<span class="category-badge">${escapeHtml(post.group.name)}</span>` : '';
  const liveBadge = post.isLive ? '<span class="live-badge">LIVE</span>' : '';
  const mediaLink = post.mediaUrl ? `<a class="media-link" href="${escapeHtml(post.mediaUrl)}" target="_blank" rel="noopener">View media</a>` : '';

  let followBtn = '';

  if (!isOwnPost)
  {
    followBtn = isFollowingAuthor
      ? `<button class="btn-small btn-outline" id="unfollow-${post._id}">Following</button>`
      : `<button class="btn-small primary-btn" id="follow-${post._id}">Follow</button>`;
  }

  let ownerActions = '';

  if (isOwnPost)
  {
    ownerActions = `
      <button class="btn-small btn-outline" id="edit-${post._id}">Edit</button>
      <button class="btn-small btn-danger" id="delete-${post._id}">Delete</button>
    `;
  }

  const commentsHtml = post.comments.map((comment) =>
  {
    const canDelete = comment.author._id === currentUser.id || isOwnPost;
    const deleteBtn = canDelete
      ? `<button id="delcomment-${post._id}-${comment._id}" title="Delete comment">&times;</button>`
      : '';

    return `
      <li class="comment-item">
        <span class="comment-author">${escapeHtml(comment.author.username)}:</span>
        ${escapeHtml(comment.text)}
        ${deleteBtn}
      </li>
    `;
  }).join('');

  return `
    <article class="card-flat post-card ${post.isLive ? 'live' : ''}">
      <div class="post-header">
        ${liveBadge}
        ${groupBadge}
      </div>
      <h3>${escapeHtml(post.title)}</h3>
      <p class="meta">By ${escapeHtml(post.author.username)} &middot; ${new Date(post.createdAt).toLocaleString()}</p>
      <p>${escapeHtml(post.content)}</p>
      ${mediaLink}
      <div class="post-actions">
        <button class="btn-small ${isLiked ? 'primary-btn' : 'btn-outline'}" id="like-${post._id}">
          ${isLiked ? 'Liked' : 'Like'} (${post.likedBy.length})
        </button>
        ${followBtn}
        ${ownerActions}
      </div>
      <ul class="comment-list">${commentsHtml}</ul>
      <form class="inline-form" id="commentForm-${post._id}">
        <div class="field" style="flex:1;">
          <input type="text" id="commentInput-${post._id}" maxlength="500" placeholder="Add a comment...">
        </div>
        <button type="submit" class="btn-small primary-btn">Comment</button>
      </form>
    </article>
  `;
}

function editCardHtml(post)
{
  return `
    <article class="card-flat post-card">
      <h2>Edit Post</h2>
      <p class="error-message" id="editError-${post._id}"></p>
      <form class="inline-form" id="editForm-${post._id}">
        <div class="field">
          <label for="editTitle-${post._id}">Title</label>
          <input type="text" id="editTitle-${post._id}" required maxlength="120" value="${escapeHtml(post.title)}">
        </div>
        <div class="field">
          <label for="editGenre-${post._id}">Genre</label>
          <input type="text" id="editGenre-${post._id}" maxlength="40" value="${escapeHtml(post.genre || '')}">
        </div>
        <div class="field">
          <label for="editMediaUrl-${post._id}">Media URL</label>
          <input type="text" id="editMediaUrl-${post._id}" maxlength="500" value="${escapeHtml(post.mediaUrl || '')}">
        </div>
        <div class="field" style="flex-basis:100%;">
          <label for="editContent-${post._id}">Content</label>
          <textarea id="editContent-${post._id}" required maxlength="3000" rows="3">${escapeHtml(post.content)}</textarea>
        </div>
        <label class="checkbox-field"><input type="checkbox" id="editIsLive-${post._id}" ${post.isLive ? 'checked' : ''}> This is a live crowd update</label>
        <button type="submit" class="btn-small primary-btn">Save</button>
        <button type="button" class="btn-small btn-outline" id="cancelEdit-${post._id}">Cancel</button>
      </form>
    </article>
  `;
}

function wireDisplayCard(post)
{
  const likeBtn = document.getElementById(`like-${post._id}`);
  const followBtn = document.getElementById(`follow-${post._id}`);
  const unfollowBtn = document.getElementById(`unfollow-${post._id}`);
  const editBtn = document.getElementById(`edit-${post._id}`);
  const deleteBtn = document.getElementById(`delete-${post._id}`);
  const commentForm = document.getElementById(`commentForm-${post._id}`);

  if (likeBtn)
  {
    likeBtn.addEventListener('click', () => handleLike(post._id));
  }

  if (followBtn)
  {
    followBtn.addEventListener('click', () => handleFollow(post.author._id));
  }

  if (unfollowBtn)
  {
    unfollowBtn.addEventListener('click', () => handleUnfollow(post.author._id));
  }

  if (editBtn)
  {
    editBtn.addEventListener('click', () =>
    {
      editingPostId = post._id;
      renderPostsList();
    });
  }

  if (deleteBtn)
  {
    deleteBtn.addEventListener('click', () => handleDeletePost(post._id));
  }

  if (commentForm)
  {
    commentForm.addEventListener('submit', (event) => handleAddComment(event, post._id));
  }

  post.comments.forEach((comment) =>
  {
    const delBtn = document.getElementById(`delcomment-${post._id}-${comment._id}`);

    if (delBtn)
    {
      delBtn.addEventListener('click', () => handleDeleteComment(post._id, comment._id));
    }
  });
}

function wireEditForm(post)
{
  const editForm = document.getElementById(`editForm-${post._id}`);
  const cancelBtn = document.getElementById(`cancelEdit-${post._id}`);

  editForm.addEventListener('submit', (event) => handleEditSubmit(event, post._id));

  cancelBtn.addEventListener('click', () =>
  {
    editingPostId = null;
    renderPostsList();
  });
}

async function handleLike(postId)
{
  try
  {
    await apiRequest(`/api/posts/${postId}/like`, { method: 'POST' });
    await loadFeed();
  }
  catch (err)
  {
    showToast(err.message, 'error');
  }
}

async function handleFollow(authorId)
{
  try
  {
    await apiRequest(`/api/users/${authorId}/follow`, { method: 'POST' });
    showToast('You are now following this user', 'success');
    await loadFollowing();
    await loadFeed();
  }
  catch (err)
  {
    showToast(err.message, 'error');
  }
}

async function handleUnfollow(authorId)
{
  try
  {
    await apiRequest(`/api/users/${authorId}/unfollow`, { method: 'POST' });
    showToast('Unfollowed', 'success');
    await loadFollowing();
    await loadFeed();
  }
  catch (err)
  {
    showToast(err.message, 'error');
  }
}

async function handleDeletePost(postId)
{
  try
  {
    await apiRequest(`/api/posts/${postId}`, { method: 'DELETE' });
    showToast('Post deleted', 'success');
    await loadFeed();
  }
  catch (err)
  {
    showToast(err.message, 'error');
  }
}

async function handleAddComment(event, postId)
{
  event.preventDefault();

  const input = document.getElementById(`commentInput-${postId}`);
  const text = input.value.trim();

  if (!text)
  {
    return;
  }

  try
  {
    await apiRequest(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ text }) });
    await loadFeed();
  }
  catch (err)
  {
    showToast(err.message, 'error');
  }
}

async function handleDeleteComment(postId, commentId)
{
  try
  {
    await apiRequest(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
    await loadFeed();
  }
  catch (err)
  {
    showToast(err.message, 'error');
  }
}

async function handleEditSubmit(event, postId)
{
  event.preventDefault();

  const errorEl = document.getElementById(`editError-${postId}`);
  errorEl.classList.remove('visible');

  const title = document.getElementById(`editTitle-${postId}`).value.trim();
  const genre = document.getElementById(`editGenre-${postId}`).value.trim();
  const mediaUrl = document.getElementById(`editMediaUrl-${postId}`).value.trim();
  const content = document.getElementById(`editContent-${postId}`).value.trim();
  const isLive = document.getElementById(`editIsLive-${postId}`).checked;

  try
  {
    await apiRequest(`/api/posts/${postId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ title, content, mediaUrl, genre, isLive })
    });

    editingPostId = null;
    showToast('Post updated', 'success');
    await loadFeed();
  }
  catch (err)
  {
    errorEl.textContent = err.message;
    errorEl.classList.add('visible');
  }
}

function setupCreateForm()
{
  const form = document.getElementById('createPostForm');
  const errorEl = document.getElementById('createError');
 const locationBtn = document.getElementById('usePostLocation');
const locationStatus = document.getElementById('postLocationStatus');

locationBtn.addEventListener('click', async () =>
{
  locationStatus.textContent = 'Getting location...';

  try
  {
    postCoords = await getCurrentCoords();
    locationStatus.textContent = 'Location added ✓';
  }
  catch (err)
  {
    postCoords = null;
    locationStatus.textContent = 'Could not get location';
  }
});

  form.addEventListener('submit', async (event) =>
  {
    event.preventDefault();
    errorEl.classList.remove('visible');

    const title = document.getElementById('postTitle').value.trim();
    const genre = document.getElementById('postGenre').value.trim();
    const group = document.getElementById('postGroup').value;
    const mediaUrl = document.getElementById('postMediaUrl').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const isLive = document.getElementById('postIsLive').checked;

    try
    {
      await apiRequest('/api/posts',
      {
        method: 'POST',
body: JSON.stringify(
{
  title,
  content,
  mediaUrl,
  genre,
  group: group || undefined,
  isLive,
  lat: postCoords ? postCoords.lat : undefined,
lng: postCoords ? postCoords.lng : undefined
})      });

      form.reset();
      postCoords = null;
document.getElementById('postLocationStatus').textContent = '';
      showToast('Post created!', 'success');
      await loadFeed();
    }
    catch (err)
    {
      errorEl.textContent = err.message;
      errorEl.classList.add('visible');
    }
  });
}

function showToast(message, type)
{
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast visible ${type}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function getCurrentCoords()
{
  return new Promise((resolve, reject) =>
  {
    if (!navigator.geolocation)
    {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(new Error(error.message))
    );
  });
}

function setupPostSearch()
{
  const form = document.getElementById('postSearchForm');
  const nearMeCheckbox = document.getElementById('searchNearMe');
  const errorEl = document.getElementById('searchError');

  form.addEventListener('submit', async (event) =>
  {
    event.preventDefault();
    errorEl.classList.remove('visible');

    if (nearMeCheckbox.checked)
    {
      try
      {
        searchCoords = await getCurrentCoords();
      }
      catch (err)
      {
        errorEl.textContent = 'Could not get your location: ' + err.message;
        errorEl.classList.add('visible');
        return;
      }
    }
    else
    {
      searchCoords = null;
    }

    await loadPostSearch();
  });
}

async function loadPostSearch()
{
  try
  {
    const genre = document.getElementById('searchGenre').value.trim();
    const isLive = document.getElementById('searchIsLive').value;

    const params = new URLSearchParams();

    if (genre)
    {
      params.set('genre', genre);
    }

    if (isLive)
    {
      params.set('isLive', isLive);
    }

    if (searchCoords)
    {
      params.set('lat', searchCoords.lat);
      params.set('lng', searchCoords.lng);
      params.set('maxDistance', 20000);
    }

    const query = params.toString();
    const { posts } = await apiRequest(`/api/posts/search${query ? '?' + query : ''}`);
    lastSearchResults = posts;
    renderSearchResultsList();
  }
  catch (err)
  {
    showToast(err.message, 'error');
  }
}

function renderSearchResultsList()
{
  const container = document.getElementById('searchResultsList');

  if (!lastSearchResults.length)
  {
    container.innerHTML = '<p class="empty-message">No posts found.</p>';
    return;
  }

  container.innerHTML = lastSearchResults.map((post) => postCardHtml(post)).join('');

  lastSearchResults.forEach((post) =>
  {
    if (post._id === editingPostId)
    {
      wireEditForm(post);
      return;
    }

    wireDisplayCard(post);
  });
}

init();
