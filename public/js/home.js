const navLinks = document.getElementById('navLinks');
const content = document.getElementById('content');

let currentUser = null;
let followingIds = new Set();

let lastPosts = [];
let recommendedPosts = [];
let discoverPosts = [];

let editingPostId = null;
let toastTimer = null;
let lastSearchResults = [];
let searchCoords = null;
let postCoords = null;
let feedMode = 'feed';
let editPostCoords = null;

let videoObserver = null;

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

    <p class="subtitle">
      Share experiences, join groups, get live updates from the crowd.
    </p>

    <a
      href="/register.html"
      class="primary-btn"
      style="
        display:block;
        text-align:center;
        text-decoration:none;
        margin-top:1.5rem;
      "
    >
      Get Started
    </a>
  `;
}

async function renderLoggedIn()
{
  document
    .querySelector('main')
    .classList.add('top-align');

  content.classList.remove('card');
  content.classList.add('page-container');

  content.innerHTML = `
    <section class="card-flat">
      <h2>Share something</h2>

      <p
        class="error-message"
        id="createError"
      ></p>

      <form
        id="createPostForm"
        class="inline-form"
      >

        <div class="field">
          <label for="postTitle">
            Title
          </label>

          <input
            type="text"
            id="postTitle"
            required
            maxlength="120"
            placeholder="What's going on?"
          >
        </div>

        <div class="field">
          <label for="postGenre">
            Genre
          </label>

          <input
            type="text"
            id="postGenre"
            maxlength="40"
            placeholder="Optional"
          >
        </div>

        <div class="field">
          <label for="postGroup">
            Group
          </label>

          <select id="postGroup">
            <option value="">
              No group
            </option>
          </select>
        </div>

        <div class="field">
          <label for="postMediaUrl">
            Media URL
          </label>

          <input
            type="text"
            id="postMediaUrl"
            maxlength="500"
            placeholder="Optional link"
          >
        </div>

        <div
          class="field"
          style="flex-basis:100%;"
        >
          <label>
            Location
          </label>

          <button
            type="button"
            id="usePostLocation"
            class="btn-small btn-outline"
          >
            Use my location
          </button>

          <span id="postLocationStatus"></span>
        </div>

        <div
          class="field"
          style="flex-basis:100%;"
        >
          <label for="postContent">
            Content
          </label>

          <textarea
            id="postContent"
            required
            maxlength="3000"
            rows="3"
          ></textarea>
        </div>

        <label class="checkbox-field">
          <input
            type="checkbox"
            id="postIsLive"
          >

          This is a live crowd update
        </label>

        <button
          type="submit"
          class="primary-btn btn-small"
        >
          Post
        </button>

      </form>
    </section>

    <section>
      <div class="feed-header">

        <h2 id="feedTitle">
          Your Feed
        </h2>

        <div class="actions">

          <button
            type="button"
            class="btn-small primary-btn"
            id="showFeedBtn"
          >
            Feed
          </button>

          <button
            type="button"
            class="btn-small btn-outline"
            id="showMyPostsBtn"
          >
            My Posts
          </button>

        </div>
      </div>

      <div
        class="posts-list"
        id="feedList"
      ></div>
    </section>

    <section class="card-flat">
      <h2>Search Posts</h2>

      <form
        id="postSearchForm"
        class="inline-form"
      >

        <div class="field">
          <label for="searchGenre">
            Genre
          </label>

          <input
            type="text"
            id="searchGenre"
            maxlength="40"
            placeholder="Any genre"
          >
        </div>

        <div class="field">
          <label for="searchIsLive">
            Live status
          </label>

          <select id="searchIsLive">
            <option value="">
              All posts
            </option>

            <option value="true">
              Live only
            </option>

            <option value="false">
              Non-live only
            </option>
          </select>
        </div>

        <label class="checkbox-field">
          <input
            type="checkbox"
            id="searchNearMe"
          >

          Near my location
        </label>

        <button
          type="submit"
          class="primary-btn btn-small"
        >
          Search
        </button>

      </form>

      <p
        class="error-message"
        id="searchError"
      ></p>

      <div
        class="posts-list"
        id="searchResultsList"
      ></div>
    </section>
  `;

  setupCreateForm();
  setupPostSearch();

  document
    .getElementById('showFeedBtn')
    .addEventListener(
      'click',
      () =>
      {
        feedMode = 'feed';
        renderPostsList();
      }
    );

  document
    .getElementById('showMyPostsBtn')
    .addEventListener(
      'click',
      () =>
      {
        feedMode = 'mine';
        renderPostsList();
      }
    );

  await Promise.all(
  [
    loadMyGroupsForSelect(),
    loadFollowing()
  ]);

  await loadFeed();
}

async function loadMyGroupsForSelect()
{
  try
  {
    const { groups } =
      await apiRequest(
        '/api/groups/mine'
      );

    const select =
      document.getElementById(
        'postGroup'
      );

    groups.forEach(
      (group) =>
      {
        const option =
          document.createElement(
            'option'
          );

        option.value =
          group._id;

        option.textContent =
          group.name;

        select.appendChild(
          option
        );
      }
    );
  }
  catch (err)
  {
    showToast(
      err.message,
      'error'
    );
  }
}

async function loadFollowing()
{
  try
  {
    const { following } =
      await apiRequest(
        '/api/users/following'
      );

    followingIds =
      new Set(
        following.map(
          user =>
            String(
              user._id ||
              user.id ||
              user
            )
        )
      );
  }
  catch (err)
  {
    showToast(
      err.message,
      'error'
    );
  }
}

async function loadFeed()
{
  try
  {
    const result =
      await apiRequest(
        '/api/posts/feed'
      );

    lastPosts =
      result.posts || [];

    recommendedPosts =
      result.recommendedPosts || [];

    discoverPosts =
      result.discoverPosts || [];

    renderPostsList();
  }
  catch (err)
  {
    showToast(
      err.message,
      'error'
    );
  }
}

function renderPostsList()
{
  const container =
    document.getElementById(
      'feedList'
    );

  const feedTitle =
    document.getElementById(
      'feedTitle'
    );

  const showFeedBtn =
    document.getElementById(
      'showFeedBtn'
    );

  const showMyPostsBtn =
    document.getElementById(
      'showMyPostsBtn'
    );

  if (feedMode === 'mine')
  {
    feedTitle.textContent =
      'My Posts';

    showFeedBtn.className =
      'btn-small btn-outline';

    showMyPostsBtn.className =
      'btn-small primary-btn';

    const myPosts =
      lastPosts.filter(
        post =>
          String(post.author._id) ===
          String(currentUser.id)
      );

    if (!myPosts.length)
    {
      container.innerHTML = `
        <p class="empty-message">
          You have not published any posts yet.
        </p>
      `;

      return;
    }

    container.innerHTML =
      myPosts
        .map(
          post =>
            postCardHtml(post)
        )
        .join('');

    myPosts.forEach(
      (post) =>
      {
        if (
          post._id ===
          editingPostId
        )
        {
          wireEditForm(post);
          return;
        }

        wireDisplayCard(post);
      }
    );

    setupVideoAutoplay(
      container
    );

    return;
  }

  feedTitle.textContent =
    'Your Feed';

  showFeedBtn.className =
    'btn-small primary-btn';

  showMyPostsBtn.className =
    'btn-small btn-outline';

  const favoriteGenres =
    Array.isArray(
      currentUser.favoriteGenres
    )
      ? currentUser.favoriteGenres
      : [];

  const genreText =
    favoriteGenres.length
      ? favoriteGenres.join(' • ')
      : '';

  let html = '';

  html += `
    <div class="feed-section-heading">

      <h2>
        Recommended for you
      </h2>

      ${
        genreText
          ? `
            <p class="subtitle">
              Based on your favorite genres:
              <strong>
                ${escapeHtml(genreText)}
              </strong>
            </p>
          `
          : `
            <p class="subtitle">
              Posts selected for you
            </p>
          `
      }

    </div>
  `;

  if (recommendedPosts.length)
  {
    html += `
      <div class="recommended-posts">

        ${recommendedPosts
          .map(
            post =>
              postCardHtml(post)
          )
          .join('')}

      </div>
    `;
  }
  else
  {
    html += `
      <p class="empty-message">
        We don't have posts for your favorite genres yet.
      </p>
    `;
  }

  if (discoverPosts.length)
  {
    html += `
      <div
        class="
          feed-section-heading
          discover-heading
        "
      >

        <h2>
          Discover new genres
        </h2>

        <p class="subtitle">
          Explore music outside your usual favorites.
        </p>

      </div>

      <div class="discover-posts">

        ${discoverPosts
          .map(
            post =>
              postCardHtml(post)
          )
          .join('')}

      </div>
    `;
  }

  if (
    !recommendedPosts.length &&
    !discoverPosts.length
  )
  {
    container.innerHTML = `
      <p class="empty-message">
        No posts are available yet.
      </p>
    `;

    return;
  }

  container.innerHTML =
    html;

  const displayedPosts =
  [
    ...recommendedPosts,
    ...discoverPosts
  ];

  displayedPosts.forEach(
    (post) =>
    {
      if (
        post._id ===
        editingPostId
      )
      {
        wireEditForm(post);
        return;
      }

      wireDisplayCard(post);
    }
  );

  setupVideoAutoplay(
    container
  );
}

function getMediaHtml(post)
{
  if (!post.mediaUrl)
  {
    return '';
  }

  const mediaUrl =
    escapeHtml(
      post.mediaUrl
    );

  const cleanUrl =
    post.mediaUrl
      .split('?')[0]
      .toLowerCase();

  const isVideo =
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg');

  if (isVideo)
  {
    return `
      <div class="post-media-wrapper">

        <video
          class="post-media post-media-video"
          src="${mediaUrl}"
          controls
          muted
          playsinline
          preload="metadata"
          loop
        >
          Your browser does not support video.
        </video>

      </div>
    `;
  }

  return `
    <div class="post-media-wrapper">

      <img
        class="post-media"
        src="${mediaUrl}"
        alt="Post media"
        loading="lazy"
      >

    </div>
  `;
}

function postCardHtml(post)
{
  if (
    post._id ===
    editingPostId
  )
  {
    return editCardHtml(
      post
    );
  }

  const isOwnPost =
    String(post.author._id) ===
    String(currentUser.id);

  const isFollowingAuthor =
    followingIds.has(
      String(post.author._id)
    );

  const isLiked =
    post.likedBy.some(
      userId =>
        String(userId) ===
        String(currentUser.id)
    );

  const groupBadge =
    post.group
      ? `
        <span class="category-badge">
          ${escapeHtml(post.group.name)}
        </span>
      `
      : '';

  const genreBadge =
    post.genre
      ? `
        <span class="category-badge">
          ${escapeHtml(post.genre)}
        </span>
      `
      : '';

  const liveBadge =
    post.isLive
      ? `
        <span class="live-badge">
          LIVE
        </span>
      `
      : '';

  const mediaHtml =
    getMediaHtml(post);

  let followBtn = '';

  /*
    A Follow button appears directly
    on posts from users that the
    current user does not follow.
  */
  if (
    !isOwnPost &&
    !isFollowingAuthor
  )
  {
    followBtn = `
      <button
        class="btn-small primary-btn"
        id="follow-${post._id}"
      >
        Follow
      </button>
    `;
  }

  let ownerActions = '';

  if (isOwnPost)
  {
    ownerActions = `
      <button
        class="btn-small btn-outline"
        id="edit-${post._id}"
      >
        Edit
      </button>

      <button
        class="btn-small btn-danger"
        id="delete-${post._id}"
      >
        Delete
      </button>
    `;
  }

  const commentsHtml =
    post.comments
      .map(
        (comment) =>
        {
          const canDelete =
            String(
              comment.author._id
            ) ===
            String(
              currentUser.id
            ) ||
            isOwnPost;

          const deleteBtn =
            canDelete
              ? `
                <button
                  id="delcomment-${post._id}-${comment._id}"
                  title="Delete comment"
                >
                  &times;
                </button>
              `
              : '';

          return `
            <li class="comment-item">

              <span class="comment-author">
                ${escapeHtml(comment.author.username)}:
              </span>

              ${escapeHtml(comment.text)}

              ${deleteBtn}

            </li>
          `;
        }
      )
      .join('');

  return `
    <article
      class="
        card-flat
        post-card
        ${post.isLive ? 'live' : ''}
      "
    >

      <div class="post-header">

        ${liveBadge}

        ${genreBadge}

        ${groupBadge}

      </div>

      <h3>
        ${escapeHtml(post.title)}
      </h3>

      <p class="meta">

        By
        ${escapeHtml(post.author.username)}

        &middot;

        ${new Date(
          post.createdAt
        ).toLocaleString()}

      </p>

      <p>
        ${escapeHtml(post.content)}
      </p>

      ${mediaHtml}

      <div class="post-actions">

        <button
          class="
            btn-small
            ${
              isLiked
                ? 'primary-btn'
                : 'btn-outline'
            }
          "
          id="like-${post._id}"
        >

          ${
            isLiked
              ? 'Liked'
              : 'Like'
          }

          (${post.likedBy.length})

        </button>

        ${followBtn}

        ${ownerActions}

      </div>

      <ul class="comment-list">
        ${commentsHtml}
      </ul>

      <form
        class="inline-form"
        id="commentForm-${post._id}"
      >

        <div
          class="field"
          style="flex:1;"
        >

          <input
            type="text"
            id="commentInput-${post._id}"
            maxlength="500"
            placeholder="Add a comment..."
          >

        </div>

        <button
          type="submit"
          class="btn-small primary-btn"
        >
          Comment
        </button>

      </form>

    </article>
  `;
}

function editCardHtml(post)
{
  return `
    <article class="card-flat post-card">

      <h2>
        Edit Post
      </h2>

      <p
        class="error-message"
        id="editError-${post._id}"
      ></p>

      <form
        class="inline-form"
        id="editForm-${post._id}"
      >

        <div class="field">

          <label
            for="editTitle-${post._id}"
          >
            Title
          </label>

          <input
            type="text"
            id="editTitle-${post._id}"
            required
            maxlength="120"
            value="${escapeHtml(post.title)}"
          >

        </div>

        <div class="field">

          <label
            for="editGenre-${post._id}"
          >
            Genre
          </label>

          <input
            type="text"
            id="editGenre-${post._id}"
            maxlength="40"
            value="${escapeHtml(post.genre || '')}"
          >

        </div>

        <div class="field">

          <label
            for="editMediaUrl-${post._id}"
          >
            Media URL
          </label>

          <input
            type="text"
            id="editMediaUrl-${post._id}"
            maxlength="500"
            value="${escapeHtml(post.mediaUrl || '')}"
          >

        </div>

        <div
          class="field"
          style="flex-basis:100%;"
        >

          <label>
            Location
          </label>

          <button
            type="button"
            class="btn-small btn-outline"
            id="editLocation-${post._id}"
          >
            Use my location
          </button>

          <span
            id="editLocationStatus-${post._id}"
          ></span>

        </div>

        <div
          class="field"
          style="flex-basis:100%;"
        >

          <label
            for="editContent-${post._id}"
          >
            Content
          </label>

          <textarea
            id="editContent-${post._id}"
            required
            maxlength="3000"
            rows="3"
          >${escapeHtml(post.content)}</textarea>

        </div>

        <label class="checkbox-field">

          <input
            type="checkbox"
            id="editIsLive-${post._id}"
            ${post.isLive ? 'checked' : ''}
          >

          This is a live crowd update

        </label>

        <button
          type="submit"
          class="btn-small primary-btn"
        >
          Save
        </button>

        <button
          type="button"
          class="btn-small btn-outline"
          id="cancelEdit-${post._id}"
        >
          Cancel
        </button>

      </form>

    </article>
  `;
}

function setupVideoAutoplay(
  container = document
)
{
  if (
    !(
      'IntersectionObserver'
      in window
    )
  )
  {
    return;
  }

  if (!videoObserver)
  {
    videoObserver =
      new IntersectionObserver(
        (entries) =>
        {
          entries.forEach(
            (entry) =>
            {
              const video =
                entry.target;

              if (
                entry.isIntersecting &&
                entry.intersectionRatio >= 0.6
              )
              {
                document
                  .querySelectorAll(
                    '.post-media-video'
                  )
                  .forEach(
                    (otherVideo) =>
                    {
                      if (
                        otherVideo !==
                        video
                      )
                      {
                        otherVideo.pause();
                      }
                    }
                  );

                video.muted = true;

                const playPromise =
                  video.play();

                if (
                  playPromise &&
                  typeof playPromise.catch ===
                    'function'
                )
                {
                  playPromise.catch(
                    () => {}
                  );
                }
              }
              else
              {
                video.pause();
              }
            }
          );
        },

        {
          threshold:
          [
            0,
            0.25,
            0.6,
            0.8,
            1
          ]
        }
      );
  }

  container
    .querySelectorAll(
      '.post-media-video'
    )
    .forEach(
      (video) =>
      {
        if (
          video.dataset
            .autoplayObserved
        )
        {
          return;
        }

        video.dataset
          .autoplayObserved =
          'true';

        videoObserver.observe(
          video
        );
      }
    );
}

function wireDisplayCard(post)
{
  const likeBtn =
    document.getElementById(
      `like-${post._id}`
    );

  const followBtn =
    document.getElementById(
      `follow-${post._id}`
    );

  const editBtn =
    document.getElementById(
      `edit-${post._id}`
    );

  const deleteBtn =
    document.getElementById(
      `delete-${post._id}`
    );

  const commentForm =
    document.getElementById(
      `commentForm-${post._id}`
    );

  if (likeBtn)
  {
    likeBtn.addEventListener(
      'click',
      () =>
        handleLike(
          post._id
        )
    );
  }

  if (followBtn)
  {
    followBtn.addEventListener(
      'click',
      () =>
        handleFollow(
          post.author._id
        )
    );
  }

  if (editBtn)
  {
    editBtn.addEventListener(
      'click',
      () =>
      {
        editingPostId =
          post._id;

        renderPostsList();
      }
    );
  }

  if (deleteBtn)
  {
    deleteBtn.addEventListener(
      'click',
      () =>
        handleDeletePost(
          post._id
        )
    );
  }

  if (commentForm)
  {
    commentForm.addEventListener(
      'submit',
      event =>
        handleAddComment(
          event,
          post._id
        )
    );
  }

  post.comments.forEach(
    (comment) =>
    {
      const delBtn =
        document.getElementById(
          `delcomment-${post._id}-${comment._id}`
        );

      if (delBtn)
      {
        delBtn.addEventListener(
          'click',
          () =>
            handleDeleteComment(
              post._id,
              comment._id
            )
        );
      }
    }
  );
}

function wireEditForm(post)
{
  const editForm =
    document.getElementById(
      `editForm-${post._id}`
    );

  const cancelBtn =
    document.getElementById(
      `cancelEdit-${post._id}`
    );

  const locationBtn =
    document.getElementById(
      `editLocation-${post._id}`
    );

  const locationStatus =
    document.getElementById(
      `editLocationStatus-${post._id}`
    );

  locationBtn.addEventListener(
    'click',
    async () =>
    {
      locationStatus.textContent =
        'Getting location...';

      try
      {
        editPostCoords =
          await getCurrentCoords();

        locationStatus.textContent =
          'Location updated ✓';
      }
      catch (err)
      {
        editPostCoords = null;

        locationStatus.textContent =
          'Could not get location';
      }
    }
  );

  editForm.addEventListener(
    'submit',
    event =>
      handleEditSubmit(
        event,
        post._id
      )
  );

  cancelBtn.addEventListener(
    'click',
    () =>
    {
      editingPostId = null;
      editPostCoords = null;

      renderPostsList();
    }
  );
}

async function handleLike(postId)
{
  try
  {
    await apiRequest(
      `/api/posts/${postId}/like`,
      {
        method: 'POST'
      }
    );

    await loadFeed();
  }
  catch (err)
  {
    showToast(
      err.message,
      'error'
    );
  }
}

async function handleFollow(authorId)
{
  try
  {
    await apiRequest(
      `/api/users/${authorId}/follow`,
      {
        method: 'POST'
      }
    );

    showToast(
      'You are now following this user',
      'success'
    );

    await loadFollowing();
    await loadFeed();
  }
  catch (err)
  {
    showToast(
      err.message,
      'error'
    );
  }
}

async function handleUnfollow(authorId)
{
  try
  {
    await apiRequest(
      `/api/users/${authorId}/unfollow`,
      {
        method: 'POST'
      }
    );

    showToast(
      'Unfollowed',
      'success'
    );

    await loadFollowing();
    await loadFeed();
  }
  catch (err)
  {
    showToast(
      err.message,
      'error'
    );
  }
}

async function handleDeletePost(postId)
{
  try
  {
    await apiRequest(
      `/api/posts/${postId}`,
      {
        method: 'DELETE'
      }
    );

    showToast(
      'Post deleted',
      'success'
    );

    await loadFeed();
  }
  catch (err)
  {
    showToast(
      err.message,
      'error'
    );
  }
}

async function handleAddComment(
  event,
  postId
)
{
  event.preventDefault();

  const input =
    document.getElementById(
      `commentInput-${postId}`
    );

  const text =
    input.value.trim();

  if (!text)
  {
    return;
  }

  try
  {
    await apiRequest(
      `/api/posts/${postId}/comments`,
      {
        method: 'POST',

        body: JSON.stringify(
        {
          text
        })
      }
    );

    await loadFeed();
  }
  catch (err)
  {
    showToast(
      err.message,
      'error'
    );
  }
}

async function handleDeleteComment(
  postId,
  commentId
)
{
  try
  {
    await apiRequest(
      `/api/posts/${postId}/comments/${commentId}`,
      {
        method: 'DELETE'
      }
    );

    await loadFeed();
  }
  catch (err)
  {
    showToast(
      err.message,
      'error'
    );
  }
}

async function handleEditSubmit(
  event,
  postId
)
{
  event.preventDefault();

  const errorEl =
    document.getElementById(
      `editError-${postId}`
    );

  errorEl.classList.remove(
    'visible'
  );

  const title =
    document
      .getElementById(
        `editTitle-${postId}`
      )
      .value
      .trim();

  const genre =
    document
      .getElementById(
        `editGenre-${postId}`
      )
      .value
      .trim();

  const mediaUrl =
    document
      .getElementById(
        `editMediaUrl-${postId}`
      )
      .value
      .trim();

  const contentValue =
    document
      .getElementById(
        `editContent-${postId}`
      )
      .value
      .trim();

  const isLive =
    document.getElementById(
      `editIsLive-${postId}`
    ).checked;

  try
  {
    await apiRequest(
      `/api/posts/${postId}`,
      {
        method: 'PUT',

        body: JSON.stringify(
        {
          title,

          content:
            contentValue,

          mediaUrl,
          genre,
          isLive,

          lat:
            editPostCoords
              ? editPostCoords.lat
              : undefined,

          lng:
            editPostCoords
              ? editPostCoords.lng
              : undefined
        })
      }
    );

    editingPostId = null;
    editPostCoords = null;

    showToast(
      'Post updated',
      'success'
    );

    await loadFeed();
  }
  catch (err)
  {
    errorEl.textContent =
      err.message;

    errorEl.classList.add(
      'visible'
    );
  }
}

function setupCreateForm()
{
  const form =
    document.getElementById(
      'createPostForm'
    );

  const errorEl =
    document.getElementById(
      'createError'
    );

  const locationBtn =
    document.getElementById(
      'usePostLocation'
    );

  const locationStatus =
    document.getElementById(
      'postLocationStatus'
    );

  locationBtn.addEventListener(
    'click',
    async () =>
    {
      locationStatus.textContent =
        'Getting location...';

      try
      {
        postCoords =
          await getCurrentCoords();

        locationStatus.textContent =
          'Location added ✓';
      }
      catch (err)
      {
        postCoords = null;

        locationStatus.textContent =
          'Could not get location';
      }
    }
  );

  form.addEventListener(
    'submit',
    async (event) =>
    {
      event.preventDefault();

      errorEl.classList.remove(
        'visible'
      );

      const title =
        document
          .getElementById(
            'postTitle'
          )
          .value
          .trim();

      const genre =
        document
          .getElementById(
            'postGenre'
          )
          .value
          .trim();

      const group =
        document.getElementById(
          'postGroup'
        ).value;

      const mediaUrl =
        document
          .getElementById(
            'postMediaUrl'
          )
          .value
          .trim();

      const postContent =
        document
          .getElementById(
            'postContent'
          )
          .value
          .trim();

      const isLive =
        document.getElementById(
          'postIsLive'
        ).checked;

      try
      {
        await apiRequest(
          '/api/posts',
          {
            method: 'POST',

            body: JSON.stringify(
            {
              title,

              content:
                postContent,

              mediaUrl,
              genre,

              group:
                group ||
                undefined,

              isLive,

              lat:
                postCoords
                  ? postCoords.lat
                  : undefined,

              lng:
                postCoords
                  ? postCoords.lng
                  : undefined
            })
          }
        );

        form.reset();

        postCoords = null;

        document.getElementById(
          'postLocationStatus'
        ).textContent = '';

        showToast(
          'Post created!',
          'success'
        );

        await loadFeed();
      }
      catch (err)
      {
        errorEl.textContent =
          err.message;

        errorEl.classList.add(
          'visible'
        );
      }
    }
  );
}

function showToast(
  message,
  type
)
{
  const toast =
    document.getElementById(
      'toast'
    );

  toast.textContent =
    message;

  toast.className =
    `toast visible ${type}`;

  clearTimeout(
    toastTimer
  );

  toastTimer =
    setTimeout(
      () =>
      {
        toast.classList.remove(
          'visible'
        );
      },
      3000
    );
}

function getCurrentCoords()
{
  return new Promise(
    (resolve, reject) =>
    {
      if (
        !navigator.geolocation
      )
      {
        reject(
          new Error(
            'Geolocation is not supported by your browser'
          )
        );

        return;
      }

      navigator.geolocation
        .getCurrentPosition(
          (position) =>
          {
            resolve(
            {
              lat:
                position
                  .coords
                  .latitude,

              lng:
                position
                  .coords
                  .longitude
            });
          },

          (error) =>
          {
            reject(
              new Error(
                error.message ||
                'Unable to detect location'
              )
            );
          }
        );
    }
  );
}

function setupPostSearch()
{
  const form =
    document.getElementById(
      'postSearchForm'
    );

  const nearMeCheckbox =
    document.getElementById(
      'searchNearMe'
    );

  const errorEl =
    document.getElementById(
      'searchError'
    );

  form.addEventListener(
    'submit',
    async (event) =>
    {
      event.preventDefault();

      errorEl.classList.remove(
        'visible'
      );

      if (
        nearMeCheckbox.checked
      )
      {
        try
        {
          searchCoords =
            await getCurrentCoords();
        }
        catch (err)
        {
          errorEl.textContent =
            'Could not get your location: ' +
            err.message;

          errorEl.classList.add(
            'visible'
          );

          return;
        }
      }
      else
      {
        searchCoords = null;
      }

      await loadPostSearch();
    }
  );
}

async function loadPostSearch()
{
  try
  {
    const genre =
      document
        .getElementById(
          'searchGenre'
        )
        .value
        .trim();

    const isLive =
      document.getElementById(
        'searchIsLive'
      ).value;

    const params =
      new URLSearchParams();

    if (genre)
    {
      params.set(
        'genre',
        genre
      );
    }

    if (isLive)
    {
      params.set(
        'isLive',
        isLive
      );
    }

    if (searchCoords)
    {
      params.set(
        'lat',
        searchCoords.lat
      );

      params.set(
        'lng',
        searchCoords.lng
      );

      params.set(
        'maxDistance',
        20000
      );
    }

    const query =
      params.toString();

    const { posts } =
      await apiRequest(
        `/api/posts/search${
          query
            ? '?' + query
            : ''
        }`
      );

    lastSearchResults =
      posts;

    renderSearchResultsList();
  }
  catch (err)
  {
    showToast(
      err.message,
      'error'
    );
  }
}

function renderSearchResultsList()
{
  const container =
    document.getElementById(
      'searchResultsList'
    );

  if (
    !lastSearchResults.length
  )
  {
    container.innerHTML = `
      <p class="empty-message">
        No posts found.
      </p>
    `;

    return;
  }

  container.innerHTML =
    lastSearchResults
      .map(
        post =>
          postCardHtml(post)
      )
      .join('');

  lastSearchResults.forEach(
    (post) =>
    {
      if (
        post._id ===
        editingPostId
      )
      {
        wireEditForm(post);
        return;
      }

      wireDisplayCard(post);
    }
  );

  setupVideoAutoplay(
    container
  );
}

init();