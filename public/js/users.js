const searchUsersForm = document.getElementById('searchUsersForm');
const showAllUsersBtn = document.getElementById('showAllUsersBtn');
const usersList = document.getElementById('usersList');
const usersMessage = document.getElementById('usersMessage');

const editProfileForm = document.getElementById('editProfileForm');
const profileUsername = document.getElementById('profileUsername');
const profileEmail = document.getElementById('profileEmail');
const profileAvatar = document.getElementById('profileAvatar');
const profileGenres = document.getElementById('profileGenres');
const profilePassword = document.getElementById('profilePassword');
const profileMessage = document.getElementById('profileMessage');

const navLinks = document.getElementById('navLinks');

let currentUser = null;
let followingIds = new Set();

async function loadCurrentUser() {
    try {
        const response = await fetch('/api/users/me');

        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }

        const data = await response.json();

        currentUser = data.user;

        if (navLinks) {
            renderNav(
                navLinks,
                currentUser,
                'users'
            );
        }

        profileUsername.value = data.user.username || '';
        profileEmail.value = data.user.email || '';
        profileAvatar.value = data.user.avatarUrl || '';
        profileGenres.value =
            (data.user.favoriteGenres || []).join(', ');
    }
    catch (err) {
        console.error(
            'Load current user error:',
            err
        );

        profileMessage.textContent =
            'Failed to load profile';
    }
}

async function loadFollowing() {
    try {
        const response =
            await fetch('/api/users/following');

        const data =
            await response.json();

        if (!response.ok) {
            return;
        }

        followingIds =
            new Set(
                data.following.map(
                    user =>
                        String(
                            user._id ||
                            user.id
                        )
                )
            );
    }
    catch (err) {
        console.error(
            'Load following error:',
            err
        );
    }
}

function renderUsers(users) {
    usersList.innerHTML = '';

    if (!users.length) {
        usersMessage.textContent =
            'No users found';

        return;
    }

    usersMessage.textContent = '';

    users.forEach(
        (user) => {
            const userId =
                String(
                    user._id ||
                    user.id
                );

            const currentUserId =
                currentUser
                    ? String(
                        currentUser._id ||
                        currentUser.id
                    )
                    : '';

            if (
                currentUser &&
                userId === currentUserId
            ) {
                return;
            }

            const row =
                document.createElement('div');

            row.className =
                'user-row';

            const avatar =
                user.avatarUrl
                    ? `
                        <img
                            src="${user.avatarUrl}"
                            alt="${user.username}"
                            class="user-avatar"
                        >
                      `
                    : `
                        <div
                            class="user-avatar user-avatar-placeholder"
                        >
                            ${user.username
                                .charAt(0)
                                .toUpperCase()}
                        </div>
                      `;

            const genres =
                user.favoriteGenres &&
                user.favoriteGenres.length
                    ? user.favoriteGenres.join(', ')
                    : 'No favorite genres';

            const isFollowing =
                followingIds.has(userId);

            row.innerHTML = `
                <a
                    href="/user-profile.html?id=${userId}"
                    class="user-main user-profile-link"
                >
                    ${avatar}

                    <div class="user-info">
                        <strong class="user-name">
                            ${user.username}
                        </strong>

                        <span class="user-email">
                            ${user.email}
                        </span>

                        <span class="user-genres">
                            ${genres}
                        </span>
                    </div>
                </a>

                <button
                    type="button"
                    class="${
                        isFollowing
                            ? 'secondary-btn'
                            : 'primary-btn'
                    } btn-small follow-btn"
                    data-user-id="${userId}"
                    data-following="${isFollowing}"
                >
                    ${
                        isFollowing
                            ? 'Following'
                            : 'Follow'
                    }
                </button>
            `;

            usersList.appendChild(row);
        }
    );
}

usersList.addEventListener(
    'click',
    async (event) => {
        const button =
            event.target.closest(
                '.follow-btn'
            );

        if (!button) {
            return;
        }

        const userId =
            button.dataset.userId;

        const isFollowing =
            button.dataset.following ===
            'true';

        try {
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

            if (!response.ok) {
                usersMessage.textContent =
                    data.error ||
                    'Action failed';

                return;
            }

            if (isFollowing) {
                followingIds.delete(
                    userId
                );

                button.textContent =
                    'Follow';

                button.classList.remove(
                    'secondary-btn'
                );

                button.classList.add(
                    'primary-btn'
                );

                button.dataset.following =
                    'false';
            }
            else {
                followingIds.add(
                    userId
                );

                button.textContent =
                    'Following';

                button.classList.remove(
                    'primary-btn'
                );

                button.classList.add(
                    'secondary-btn'
                );

                button.dataset.following =
                    'true';
            }
        }
        catch (err) {
            console.error(
                'Follow action error:',
                err
            );

            usersMessage.textContent =
                'Action failed';
        }
    }
);

async function loadAllUsers() {
    try {
        const response =
            await fetch('/api/users');

        const data =
            await response.json();

        if (!response.ok) {
            usersMessage.textContent =
                data.error ||
                'Failed to load users';

            return;
        }

        renderUsers(data.users);
    }
    catch (err) {
        console.error(
            'Load users error:',
            err
        );

        usersMessage.textContent =
            'Failed to load users';
    }
}

searchUsersForm.addEventListener(
    'submit',
    async (event) => {
        event.preventDefault();

        const username =
            document
                .getElementById(
                    'searchUsername'
                )
                .value
                .trim();

        const email =
            document
                .getElementById(
                    'searchEmail'
                )
                .value
                .trim();

        const genre =
            document
                .getElementById(
                    'searchGenre'
                )
                .value
                .trim();

        const params =
            new URLSearchParams();

        if (username) {
            params.append(
                'username',
                username
            );
        }

        if (email) {
            params.append(
                'email',
                email
            );
        }

        if (genre) {
            params.append(
                'genre',
                genre
            );
        }

        try {
            const response =
                await fetch(
                    `/api/users/search?${params.toString()}`
                );

            const data =
                await response.json();

            if (!response.ok) {
                usersMessage.textContent =
                    data.error ||
                    'Search failed';

                return;
            }

            renderUsers(data.users);
        }
        catch (err) {
            console.error(
                'Search users error:',
                err
            );

            usersMessage.textContent =
                'Search failed';
        }
    }
);

showAllUsersBtn.addEventListener(
    'click',
    () => {
        loadAllUsers();
    }
);

editProfileForm.addEventListener(
    'submit',
    async (event) => {
        event.preventDefault();

        const favoriteGenres =
            profileGenres.value
                .split(',')
                .map(
                    genre =>
                        genre.trim()
                )
                .filter(
                    genre =>
                        genre
                );

        const body = {
            username:
                profileUsername.value.trim(),

            email:
                profileEmail.value.trim(),

            avatarUrl:
                profileAvatar.value.trim(),

            favoriteGenres
        };

        if (profilePassword.value) {
            body.password =
                profilePassword.value;
        }

        try {
            const response =
                await fetch(
                    '/api/users/me',
                    {
                        method: 'PUT',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify(body)
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                profileMessage.textContent =
                    data.error ||
                    'Update failed';

                return;
            }

            profileMessage.textContent =
                'Profile updated successfully';

            profilePassword.value = '';

            currentUser = data.user || currentUser;

            if (
                navLinks &&
                currentUser
            ) {
                renderNav(
                    navLinks,
                    currentUser,
                    'users'
                );
            }
        }
        catch (err) {
            console.error(
                'Update profile error:',
                err
            );

            profileMessage.textContent =
                'Update failed';
        }
    }
);

async function initUsersPage() {
    await loadCurrentUser();

    if (!currentUser) {
        return;
    }

    await loadFollowing();
    await loadAllUsers();
}

initUsersPage();