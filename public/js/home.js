const navLinks = document.getElementById('navLinks');
const content = document.getElementById('content');

async function init()
{
  const result = await getCurrentUser();
  const user = result && result.user ? result.user : null;

  renderNav(navLinks, user, 'home');

  if (user)
  {
    renderLoggedIn(user);
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

function renderLoggedIn(user)
{
  content.innerHTML = `
    <h1>Welcome back, ${escapeHtml(user.username)}</h1>
    <p class="subtitle">Your feed will show up here soon. Check out your <a href="/groups.html">groups</a> to get started.</p>
  `;
}

init();
