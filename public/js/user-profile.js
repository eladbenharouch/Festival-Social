const navLinks = document.getElementById('navLinks');

const profileUsername = document.getElementById('profileUsername');
const profileAvatarLarge = document.getElementById('profileAvatarLarge');
const profileGenresText = document.getElementById('profileGenresText');

const postsCount = document.getElementById('postsCount');
const followersCount = document.getElementById('followersCount');
const followingCount = document.getElementById('followingCount');

const followUserBtn = document.getElementById('followUserBtn');
const followersBtn = document.getElementById('followersBtn');
const followingBtn = document.getElementById('followingBtn');

const usersModal = document.getElementById('usersModal');
const usersModalTitle = document.getElementById('usersModalTitle');
const usersModalList = document.getElementById('usersModalList');
const closeUsersModalBtn = document.getElementById('closeUsersModalBtn');

const profilePostsGrid = document.getElementById('profilePostsGrid');
const profilePostsMessage = document.getElementById('profilePostsMessage');

const params =
  new URLSearchParams(
    window.location.search
  );

const userId =
  params.get('id');

let currentUser = null;
let viewedUser = null;
let isFollowing = false;


/* =========================
   AVATAR
========================= */

function renderAvatar(user)
{
  profileAvatarLarge.innerHTML = '';

  if (user.avatarUrl)
  {
    const img =
      document.createElement('img');

    img.src = user.avatarUrl;
    img.alt = user.username;

    profileAvatarLarge.appendChild(img);
  }
  else
  {
    profileAvatarLarge.textContent =
      user.username
        .charAt(0)
        .toUpperCase();
  }
}


/* =========================
   CURRENT USER
========================= */

async function loadCurrentUser()
{
  try
  {
    const response =
      await fetch('/api/users/me');

    if (!response.ok)
    {
      window.location.href =
        '/login.html';

      return false;
    }

    const data =
      await response.json();

    currentUser = data.user;

    renderNav(
      navLinks,
      currentUser,
      ''
    );

    return true;
  }
  catch (err)
  {
    console.error(
      'Load current user error:',
      err
    );

    return false;
  }
}


/* =========================
   FOLLOW BUTTON
========================= */

function updateFollowButton()
{
  if (!followUserBtn)
  {
    return;
  }

  if (isFollowing)
  {
    followUserBtn.textContent =
      'Following';

    followUserBtn.classList.remove(
      'primary-btn'
    );

    followUserBtn.classList.add(
      'secondary-btn'
    );
  }
  else
  {
    followUserBtn.textContent =
      'Follow';

    followUserBtn.classList.remove(
      'secondary-btn'
    );

    followUserBtn.classList.add(
      'primary-btn'
    );
  }
}


/* =========================
   PROFILE
========================= */

async function loadUserProfile()
{
  try
  {
    const response =
      await fetch(
        `/api/users/${userId}/profile`
      );

    const data =
      await response.json();

    if (!response.ok)
    {
      profilePostsMessage.textContent =
        data.error ||
        'Failed to load profile';

      return;
    }

    viewedUser = data.user;

    isFollowing =
      Boolean(data.isFollowing);

    profileUsername.textContent =
      `@${viewedUser.username}`;

    renderAvatar(viewedUser);

    profileGenresText.textContent =
      viewedUser.favoriteGenres &&
      viewedUser.favoriteGenres.length
        ? `Favorite genres: ${viewedUser.favoriteGenres.join(', ')}`
        : 'No favorite genres yet';

    postsCount.textContent =
      data.stats.postsCount;

    followersCount.textContent =
      data.stats.followersCount;

    followingCount.textContent =
      data.stats.followingCount;

    updateFollowButton();
  }
  catch (err)
  {
    console.error(
      'Load profile error:',
      err
    );

    profilePostsMessage.textContent =
      'Failed to load profile';
  }
}


/* =========================
   POSTS
========================= */

async function loadUserPosts()
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

    const userPosts =
      posts.filter((post) =>
      {
        const authorId =
          typeof post.author === 'object'
            ? post.author._id ||
              post.author.id
            : post.author;

        return (
          String(authorId) ===
          String(userId)
        );
      });

    renderUserPosts(userPosts);
  }
  catch (err)
  {
    console.error(
      'Load posts error:',
      err
    );

    profilePostsMessage.textContent =
      'Failed to load posts';
  }
}


function renderUserPosts(posts)
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

    card.setAttribute(
      'role',
      'link'
    );

    /*
      Clicking a post opens
      the full post page.
    */

    card.addEventListener(
      'click',
      () =>
      {
        window.location.href =
          `/post.html?id=${post._id}`;
      }
    );

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

      img.src =
        post.mediaUrl;

      img.alt =
        post.title || 'Post';

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

    if (
      currentUser &&
      String(currentUser.id) ===
      profileId
    )
    {
      row.href =
        '/profile.html';
    }
    else
    {
      row.href =
        `/user-profile.html?id=${profileId}`;
    }

    row.className =
      'user-row user-profile-link';

    const main =
      document.createElement('div');

    main.className =
      'user-main';

    if (user.avatarUrl)
    {
      const avatar =
        document.createElement('img');

      avatar.src =
        user.avatarUrl;

      avatar.alt =
        user.username;

      avatar.className =
        'user-avatar';

      main.appendChild(avatar);
    }
    else
    {
      const avatar =
        document.createElement('div');

      avatar.className =
        'user-avatar user-avatar-placeholder';

      avatar.textContent =
        user.username
          .charAt(0)
          .toUpperCase();

      main.appendChild(avatar);
    }

    const info =
      document.createElement('div');

    info.className =
      'user-info';

    const name =
      document.createElement('strong');

    name.className =
      'user-name';

    name.textContent =
      user.username;

    const genres =
      document.createElement('span');

    genres.className =
      'user-genres';

    genres.textContent =
      user.favoriteGenres &&
      user.favoriteGenres.length
        ? user.favoriteGenres.join(', ')
        : 'No favorite genres';

    info.appendChild(name);
    info.appendChild(genres);

    main.appendChild(info);

    row.appendChild(main);

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
        await fetch(
          `/api/users/${userId}/followers`
        );

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
        'Followers error:',
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
        await fetch(
          `/api/users/${userId}/following`
        );

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
        'Following error:',
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
   FOLLOW / UNFOLLOW
========================= */

followUserBtn.addEventListener(
  'click',
  async () =>
  {
    if (!currentUser)
    {
      return;
    }

    if (
      String(currentUser.id) ===
      String(userId)
    )
    {
      window.location.href =
        '/profile.html';

      return;
    }

    followUserBtn.disabled = true;

    try
    {
      const endpoint =
        isFollowing
          ? `/api/users/${userId}/unfollow`
          : `/api/users/${userId}/follow`;

      const response =
        await fetch(
          endpoint,
          {
            method: 'POST'
          }
        );

      const data =
        await response.json();

      if (!response.ok)
      {
        console.error(
          data.error ||
          'Follow action failed'
        );

        return;
      }

      await loadUserProfile();
    }
    catch (err)
    {
      console.error(
        'Follow error:',
        err
      );
    }
    finally
    {
      followUserBtn.disabled =
        false;
    }
  }
);


/* =========================
   INIT
========================= */

async function initUserProfile()
{
  if (!userId)
  {
    window.location.href =
      '/users.html';

    return;
  }

  const loggedIn =
    await loadCurrentUser();

  if (!loggedIn)
  {
    return;
  }

  if (
    String(currentUser.id) ===
    String(userId)
  )
  {
    window.location.href =
      '/profile.html';

    return;
  }

  await loadUserProfile();
  await loadUserPosts();
}


initUserProfile();