const navLinks = document.getElementById('navLinks');
const content = document.getElementById('content');

async function init()
{
  const result = await getCurrentUser();

  if (result && result.user)
  {
    renderLoggedIn(result.user);
  }
  else
  {
    renderLoggedOut();
  }
}

function renderLoggedOut()
{
  navLinks.innerHTML = `
    <li><a href="/login.html">Login</a></li>
    <li><a href="/register.html">Sign Up</a></li>
  `;

  content.innerHTML = `
    <h1>Find your next festival</h1>
    <p class="subtitle">Share experiences, join groups, get live updates from the crowd.</p>
    <a href="/register.html" class="primary-btn" style="display:block; text-align:center; text-decoration:none; margin-top:1.5rem;">Get Started</a>
  `;
}

function renderLoggedIn(user)
{
  navLinks.innerHTML = `
    <li>Hey, ${escapeHtml(user.username)}</li>
    <li><a href="#" id="logoutLink">Logout</a></li>
  `;

  content.innerHTML = `
    <h1>Welcome back, ${escapeHtml(user.username)}</h1>
    <p class="subtitle">Your feed will show up here soon.</p>
  `;

  document.getElementById('logoutLink').addEventListener('click', async (event) =>
  {
    event.preventDefault();
    await apiRequest('/api/users/logout', { method: 'POST' }).catch(() => {});
    window.location.reload();
  });
}

function escapeHtml(text)
{
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

init();
