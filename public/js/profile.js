const profileUsername = document.getElementById('profileUsername');
const profileAvatarLarge = document.getElementById('profileAvatarLarge');
const profileGenresText = document.getElementById('profileGenresText');

const postsCount = document.getElementById('postsCount');
const followersCount = document.getElementById('followersCount');
const followingCount = document.getElementById('followingCount');

const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileSection = document.getElementById('editProfileSection');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const profileEditForm = document.getElementById('profileEditForm');

const editUsername = document.getElementById('editUsername');
const editEmail = document.getElementById('editEmail');
const editAvatarUrl = document.getElementById('editAvatarUrl');
const editFavoriteGenres = document.getElementById('editFavoriteGenres');
const editPassword = document.getElementById('editPassword');
const profileEditMessage = document.getElementById('profileEditMessage');

const profilePostsGrid = document.getElementById('profilePostsGrid');
const profilePostsMessage = document.getElementById('profilePostsMessage');

const followersBtn = document.getElementById('followersBtn');
const followingBtn = document.getElementById('followingBtn');

const usersModal = document.getElementById('usersModal');
const usersModalTitle = document.getElementById('usersModalTitle');
const usersModalList = document.getElementById('usersModalList');
const closeUsersModalBtn = document.getElementById('closeUsersModalBtn');

let currentUser = null;


/* =========================
   AVATAR
========================= */

function renderAvatar(user)
{
  profileAvatarLarge.innerHTML = '';

  if (user.avatarUrl)
  {
    const img = document.createElement('img');

    img.src = user.avatarUrl;
    img.alt = user.username;

    profileAvatarLarge.appendChild(img);
  }
  else
  {
    profileAvatarLarge.textContent =
      user.username.charAt(0).toUpperCase();
  }
}


/* =========================
   PROFILE
========================= */

async function loadProfile()
{
  try
  {
    const response =
      await fetch('/api/users/me');

    if (!response.ok)
    {
      window.location.href = '/login.html';
      return false;
    }

    const data =
      await response.json();

    currentUser = data.user;

    profileUsername.textContent =
      `@${currentUser.username}`;

    renderAvatar(currentUser);

    profileGenresText.textContent =
      currentUser.favoriteGenres &&
      currentUser.favoriteGenres.length
        ? `Favorite genres: ${currentUser.favoriteGenres.join(', ')}`
        : 'No favorite genres yet';

    editUsername.value =
      currentUser.username || '';

    editEmail.value =
      currentUser.email || '';

    editAvatarUrl.value =
      currentUser.avatarUrl || '';

    editFavoriteGenres.value =
      (currentUser.favoriteGenres || [])
        .join(', ');

    return true;
  }
  catch (err)
  {
    console.error(
      'Load profile error:',
      err
    );

    return false;
  }
}


/* =========================
   STATS
========================= */

async function loadProfileStats()
{
  try
  {
    const response =
      await fetch('/api/users/me/stats');

    const data =
      await response.json();

    if (!response.ok)
    {
      return;
    }

    postsCount.textContent =
      data.postsCount;

    followersCount.textContent =
      data.followersCount;

    followingCount.textContent =
      data.followingCount;
  }
  catch (err)
  {
    console.error(
      'Load profile stats error:',
      err
    );
  }
}


/* =========================
   MY POSTS
========================= */

async function loadMyPosts()
{
  try
  {
    const response =
      await fetch('/api/posts/feed');

    const data =
      await response.json();

    if (!response.ok)
    {
      profilePostsMessage.textContent =
        'Failed to load posts';

      return;
    }

    const posts =
      data.posts || data || [];

    const myPosts =
      posts.filter((post) =>
      {
        const authorId =
          typeof post.author === 'object'
            ? post.author._id ||
              post.author.id
            : post.author;

        return (
          String(authorId) ===
          String(currentUser.id)
        );
      });

    renderMyPosts(myPosts);
  }
  catch (err)
  {
    console.error(
      'Load profile posts error:',
      err
    );

    profilePostsMessage.textContent =
      'Failed to load posts';
  }
}


function renderMyPosts(posts)
{
  profilePostsGrid.innerHTML = '';

  if (!posts.length)
  {
    profilePostsMessage.textContent =
      'No posts yet';

    return;
  }

  profilePostsMessage.textContent = '';

  posts.forEach((post) =>
  {
    const card =
      document.createElement('article');

    card.className =
      'profile-post-card';

    card.tabIndex = 0;
    card.setAttribute('role', 'link');

    card.addEventListener('click', () =>
    {
      window.location.href =
        `/post.html?id=${post._id}`;
    });

    card.addEventListener(
      'keydown',
      (event) =>
      {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        )
        {
          event.preventDefault();

          window.location.href =
            `/post.html?id=${post._id}`;
        }
      }
    );

    if (post.mediaUrl)
    {
      const img =
        document.createElement('img');

      img.src = post.mediaUrl;
      img.alt = post.title || 'Post';

      img.className =
        'profile-post-media';

      card.appendChild(img);
    }

    const content =
      document.createElement('div');

    content.className =
      'profile-post-content';

    const title =
      document.createElement('h3');

    title.textContent =
      post.title || '';

    const text =
      document.createElement('p');

    text.textContent =
      post.content || '';

    content.appendChild(title);
    content.appendChild(text);

    card.appendChild(content);

    profilePostsGrid.appendChild(card);
  });
}


/* =========================
   EDIT PROFILE
========================= */

editProfileBtn.addEventListener(
  'click',
  () =>
  {
    editProfileSection.hidden = false;
  }
);


cancelEditBtn.addEventListener(
  'click',
  () =>
  {
    editProfileSection.hidden = true;
    profileEditMessage.textContent = '';
  }
);


profileEditForm.addEventListener(
  'submit',
  async (event) =>
  {
    event.preventDefault();

    const favoriteGenres =
      editFavoriteGenres.value
        .split(',')
        .map((genre) => genre.trim())
        .filter((genre) => genre);

    const body =
    {
      username:
        editUsername.value.trim(),

      email:
        editEmail.value.trim(),

      avatarUrl:
        editAvatarUrl.value.trim(),

      favoriteGenres
    };

    if (editPassword.value)
    {
      body.password =
        editPassword.value;
    }

    try
    {
      const response =
        await fetch(
          '/api/users/me',
          {
            method: 'PUT',

            headers:
            {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(body)
          }
        );

      const data =
        await response.json();

      if (!response.ok)
      {
        profileEditMessage.textContent =
          data.error ||
          'Failed to update profile';

        return;
      }

      profileEditMessage.textContent =
        'Profile updated successfully';

      editPassword.value = '';

      await loadProfile();

      renderNav(
        document.getElementById('navLinks'),
        currentUser,
        'profile'
      );
    }
    catch (err)
    {
      console.error(
        'Update profile error:',
        err
      );

      profileEditMessage.textContent =
        'Failed to update profile';
    }
  }
);


/* =========================
   USER LIST
========================= */

function renderUserList(users)
{
  usersModalList.innerHTML = '';

  if (!users || !users.length)
  {
    usersModalList.innerHTML =
      '<p>No users found.</p>';

    return;
  }

  users.forEach((user) =>
  {
    const profileId =
      String(user._id || user.id);

    const row =
      document.createElement('a');

    row.className =
      'user-row user-profile-link';

    if (
      currentUser &&
      String(currentUser.id) ===
      profileId
    )
    {
      row.href = '/profile.html';
    }
    else
    {
      row.href =
        `/user-profile.html?id=${profileId}`;
    }

    const avatar =
      user.avatarUrl
        ? `
          <img
            src="${user.avatarUrl}"
            alt="${user.username}"
            class="user-avatar">
        `
        : `
          <div
            class="user-avatar user-avatar-placeholder">
            ${user.username.charAt(0).toUpperCase()}
          </div>
        `;

    row.innerHTML = `
      <div class="user-main">

        ${avatar}

        <div class="user-info">

          <strong class="user-name">
            ${user.username}
          </strong>

          <span class="user-genres">
            ${
              user.favoriteGenres &&
              user.favoriteGenres.length
                ? user.favoriteGenres.join(', ')
                : 'No favorite genres'
            }
          </span>

        </div>

      </div>
    `;

    usersModalList.appendChild(row);
  });
}


/* =========================
   FOLLOWERS
========================= */

followersBtn.addEventListener(
  'click',
  async () =>
  {
    usersModalTitle.textContent =
      'Followers';

    usersModalList.innerHTML =
      '<p>Loading...</p>';

    usersModal.hidden = false;

    try
    {
      const response =
        await fetch('/api/users/followers');

      const data =
        await response.json();

      if (!response.ok)
      {
        usersModalList.innerHTML =
          '<p>Failed to load followers.</p>';

        return;
      }

      renderUserList(
        data.followers || []
      );
    }
    catch (err)
    {
      console.error(
        'Load followers error:',
        err
      );

      usersModalList.innerHTML =
        '<p>Failed to load followers.</p>';
    }
  }
);


/* =========================
   FOLLOWING
========================= */

followingBtn.addEventListener(
  'click',
  async () =>
  {
    usersModalTitle.textContent =
      'Following';

    usersModalList.innerHTML =
      '<p>Loading...</p>';

    usersModal.hidden = false;

    try
    {
      const response =
        await fetch('/api/users/following');

      const data =
        await response.json();

      if (!response.ok)
      {
        usersModalList.innerHTML =
          '<p>Failed to load following.</p>';

        return;
      }

      renderUserList(
        data.following || []
      );
    }
    catch (err)
    {
      console.error(
        'Load following error:',
        err
      );

      usersModalList.innerHTML =
        '<p>Failed to load following.</p>';
    }
  }
);


/* =========================
   CLOSE MODAL
========================= */

closeUsersModalBtn.addEventListener(
  'click',
  () =>
  {
    usersModal.hidden = true;
  }
);


usersModal.addEventListener(
  'click',
  (event) =>
  {
    if (event.target === usersModal)
    {
      usersModal.hidden = true;
    }
  }
);

/* =========================
   DELETE ACCOUNT
========================= */

const deleteAccountBtn = document.getElementById('deleteAccountBtn');

deleteAccountBtn.addEventListener(
  'click',
  async () =>
  {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete your account? This action is permanent and cannot be undone.'
      );

    if (!confirmed)
    {
      return;
    }

    deleteAccountBtn.disabled = true;

    try
    {
      const response =
        await fetch(
          '/api/users/me',
          {
            method: 'DELETE'
          }
        );

      const data =
        await response.json();

      if (!response.ok)
      {
        alert(
          data.error ||
          'Failed to delete account'
        );

        deleteAccountBtn.disabled = false;

        return;
      }

      window.location.href =
        '/login.html';
    }
    catch (err)
    {
      console.error(
        'Delete account error:',
        err
      );

      alert('Failed to delete account');

      deleteAccountBtn.disabled = false;
    }
  }
);

/* =========================
   INIT
========================= */

async function initProfile()
{
  const loaded =
    await loadProfile();

  if (!loaded)
  {
    return;
  }

  const navLinks =
    document.getElementById('navLinks');

  if (navLinks)
  {
    renderNav(
      navLinks,
      currentUser,
      'profile'
    );
  }

  await loadProfileStats();
  await loadMyPosts();
}


initProfile();