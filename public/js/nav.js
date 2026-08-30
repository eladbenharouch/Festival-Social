function escapeHtml(text)
{
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderNav(navElement, user, currentPage)
{
  if (!user)
  {
    navElement.innerHTML = `
      <li><a href="/login.html">Login</a></li>
      <li><a href="/register.html">Sign Up</a></li>
    `;
    return;
  }

    navElement.innerHTML = `
    <li><a href="/" class="${currentPage === 'home' ? 'active' : ''}">Feed</a></li>
    <li><a href="/groups.html" class="${currentPage === 'groups' ? 'active' : ''}">Groups</a></li>
    <li><a href="/users.html" class="${currentPage === 'users' ? 'active' : ''}">Search</a></li>
    <li><a href="/map.html" class="${currentPage === 'map' ? 'active' : ''}">Map</a></li>
    <li><a href="/weather.html" class="${currentPage === 'weather' ? 'active' : ''}">Weather</a></li>
    <li><a href="/stats.html" class="${currentPage === 'stats' ? 'active' : ''}">Statistics</a></li>
    <li>
  <a href="/profile.html" class="profile-nav-link" title="My Profile">
    ${
      user.avatarUrl
        ? `<img src="${escapeHtml(user.avatarUrl)}" alt="Profile" class="nav-avatar">`
        : `<span class="nav-avatar nav-avatar-placeholder">${escapeHtml(user.username.charAt(0).toUpperCase())}</span>`
    }
  </a>
</li>
    <li><a href="#" id="logoutLink">Logout</a></li>
  `;

  document.getElementById('logoutLink').addEventListener('click', async (event) =>
  {
    event.preventDefault();
    await apiRequest('/api/users/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/login.html';
  });
}
