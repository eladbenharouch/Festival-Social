const navLinks = document.getElementById('navLinks');
const postContainer = document.getElementById('postContainer');
const backBtn = document.getElementById('backBtn');

const params = new URLSearchParams(window.location.search);
const postId = params.get('id');

let currentUser = null;
let currentPost = null;
let toastTimer = null;


/* =========================
   ESCAPE HTML
========================= */

function safeText(value)
{
  const div = document.createElement('div');
  div.textContent = value || '';
  return div.innerHTML;
}


/* =========================
   TOAST
========================= */

function showPostToast(message, type)
{
  const toast = document.getElementById('toast');

  if (!toast)
  {
    return;
  }

  toast.textContent = message;
  toast.className = `toast visible ${type}`;

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() =>
  {
    toast.classList.remove('visible');
  }, 3000);
}


/* =========================
   CURRENT USER
========================= */

async function loadCurrentUser()
{
  try
  {
    const response = await fetch('/api/users/me');

    if (!response.ok)
    {
      window.location.href = '/login.html';
      return false;
    }

    const data = await response.json();

    currentUser = data.user;

    renderNav(navLinks, currentUser, '');

    return true;
  }
  catch (err)
  {
    console.error('Load current user error:', err);
    return false;
  }
}


/* =========================
   LOAD POST
========================= */

async function loadPost()
{
  try
  {
    const response = await fetch(
      `/api/posts/${postId}`
    );

    const data = await response.json();

    if (!response.ok)
    {
      postContainer.innerHTML = `
        <p class="error-message visible">
          ${safeText(data.error || 'Failed to load post')}
        </p>
      `;

      return;
    }

    currentPost = data.post;

    renderPost();
  }
  catch (err)
  {
    console.error('Load post error:', err);

    postContainer.innerHTML = `
      <p class="error-message visible">
        Failed to load post
      </p>
    `;
  }
}


/* =========================
   AUTHOR LINK
========================= */

function getAuthorLink()
{
  const authorId =
    currentPost.author._id ||
    currentPost.author.id;

  if (
    currentUser &&
    String(currentUser.id) === String(authorId)
  )
  {
    return '/profile.html';
  }

  return `/user-profile.html?id=${authorId}`;
}


/* =========================
   RENDER POST
========================= */

function renderPost()
{
  if (!currentPost)
  {
    return;
  }

  const authorId =
    currentPost.author._id ||
    currentPost.author.id;

  const isOwnPost =
    String(authorId) === String(currentUser.id);

  const likedBy =
    currentPost.likedBy || [];

  const isLiked = likedBy.some((id) =>
  {
    const likedId =
      typeof id === 'object'
        ? id._id || id.id
        : id;

    return String(likedId) === String(currentUser.id);
  });

  let mediaHtml = '';

  if (currentPost.mediaUrl)
  {
    mediaHtml = `
      <div class="post-detail-media">
        <img
          src="${safeText(currentPost.mediaUrl)}"
          alt="${safeText(currentPost.title || 'Post')}"
          class="profile-post-media">
      </div>
    `;
  }

  const groupBadge = currentPost.group
    ? `
      <span class="category-badge">
        ${safeText(currentPost.group.name)}
      </span>
    `
    : '';

  const liveBadge = currentPost.isLive
    ? '<span class="live-badge">LIVE</span>'
    : '';

  const commentsHtml =
    (currentPost.comments || []).map((comment) =>
    {
      const commentAuthorId =
        typeof comment.author === 'object'
          ? comment.author._id || comment.author.id
          : comment.author;

      const canDelete =
        String(commentAuthorId) === String(currentUser.id) ||
        isOwnPost;

      const commentAuthorLink =
        String(commentAuthorId) === String(currentUser.id)
          ? '/profile.html'
          : `/user-profile.html?id=${commentAuthorId}`;

      const deleteButton = canDelete
        ? `
          <button
            type="button"
            class="comment-delete-btn"
            data-comment-id="${comment._id}"
            title="Delete comment">
            ×
          </button>
        `
        : '';

      return `
        <li class="comment-item">
          <div>
            <a
              href="${commentAuthorLink}"
              class="user-profile-link">
              <strong class="comment-author">
                ${safeText(comment.author.username)}
              </strong>
            </a>

            <span>
              ${safeText(comment.text)}
            </span>
          </div>

          ${deleteButton}
        </li>
      `;
    }).join('');

  postContainer.innerHTML = `

    <div class="post-header">
      ${liveBadge}
      ${groupBadge}
    </div>

    <h1>${safeText(currentPost.title)}</h1>

    <p class="meta">
      By
      <a
        href="${getAuthorLink()}"
        class="user-profile-link">
        <strong>
          ${safeText(currentPost.author.username)}
        </strong>
      </a>

      &middot;

      ${new Date(currentPost.createdAt).toLocaleString()}
    </p>

    ${mediaHtml}

    <p class="post-detail-content">
      ${safeText(currentPost.content)}
    </p>

    ${
      currentPost.genre
        ? `
          <p>
            <strong>Genre:</strong>
            ${safeText(currentPost.genre)}
          </p>
        `
        : ''
    }

    <div class="post-actions">

      <button
        type="button"
        id="likePostBtn"
        class="btn-small ${isLiked ? 'primary-btn' : 'btn-outline'}">

        ${isLiked ? 'Liked' : 'Like'}
        (${likedBy.length})

      </button>

    </div>

    <hr>

    <section>

      <h2>
        Comments (${(currentPost.comments || []).length})
      </h2>

      <ul
        id="postCommentsList"
        class="comment-list">

        ${
          commentsHtml ||
          '<li class="empty-message">No comments yet.</li>'
        }

      </ul>

      <form
        id="postCommentForm"
        class="inline-form">

        <div
          class="field"
          style="flex:1;">

          <input
            type="text"
            id="postCommentInput"
            maxlength="500"
            placeholder="Add a comment..."
            required>

        </div>

        <button
          type="submit"
          class="btn-small primary-btn">
          Comment
        </button>

      </form>

    </section>
  `;

  wirePostActions();
}


/* =========================
   ACTIONS
========================= */

function wirePostActions()
{
  const likeBtn =
    document.getElementById('likePostBtn');

  const commentForm =
    document.getElementById('postCommentForm');

  if (likeBtn)
  {
    likeBtn.addEventListener(
      'click',
      handleLike
    );
  }

  if (commentForm)
  {
    commentForm.addEventListener(
      'submit',
      handleComment
    );
  }

  document
    .querySelectorAll('.comment-delete-btn')
    .forEach((button) =>
    {
      button.addEventListener('click', () =>
      {
        handleDeleteComment(
          button.dataset.commentId
        );
      });
    });
}


/* =========================
   LIKE
========================= */

async function handleLike()
{
  try
  {
    const response = await fetch(
      `/api/posts/${postId}/like`,
      {
        method: 'POST'
      }
    );

    const data = await response.json();

    if (!response.ok)
    {
      showPostToast(
        data.error || 'Failed to update like',
        'error'
      );

      return;
    }

    currentPost = data.post;

    renderPost();
  }
  catch (err)
  {
    console.error('Like error:', err);

    showPostToast(
      'Failed to update like',
      'error'
    );
  }
}


/* =========================
   ADD COMMENT
========================= */

async function handleComment(event)
{
  event.preventDefault();

  const input =
    document.getElementById('postCommentInput');

  const text =
    input.value.trim();

  if (!text)
  {
    return;
  }

  try
  {
    const response = await fetch(
      `/api/posts/${postId}/comments`,
      {
        method: 'POST',

        headers:
        {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(
        {
          text
        })
      }
    );

    const data = await response.json();

    if (!response.ok)
    {
      showPostToast(
        data.error || 'Failed to add comment',
        'error'
      );

      return;
    }

    currentPost = data.post;

    renderPost();

    showPostToast(
      'Comment added',
      'success'
    );
  }
  catch (err)
  {
    console.error('Comment error:', err);

    showPostToast(
      'Failed to add comment',
      'error'
    );
  }
}


/* =========================
   DELETE COMMENT
========================= */

async function handleDeleteComment(commentId)
{
  try
  {
    const response = await fetch(
      `/api/posts/${postId}/comments/${commentId}`,
      {
        method: 'DELETE'
      }
    );

    const data = await response.json();

    if (!response.ok)
    {
      showPostToast(
        data.error || 'Failed to delete comment',
        'error'
      );

      return;
    }

    await loadPost();

    showPostToast(
      'Comment deleted',
      'success'
    );
  }
  catch (err)
  {
    console.error(
      'Delete comment error:',
      err
    );

    showPostToast(
      'Failed to delete comment',
      'error'
    );
  }
}


/* =========================
   BACK
========================= */

backBtn.addEventListener('click', () =>
{
  if (window.history.length > 1)
  {
    window.history.back();
  }
  else
  {
    window.location.href = '/';
  }
});


/* =========================
   INIT
========================= */

async function initPostPage()
{
  if (!postId)
  {
    window.location.href = '/';
    return;
  }

  const loggedIn =
    await loadCurrentUser();

  if (!loggedIn)
  {
    return;
  }

  await loadPost();
}


initPostPage();