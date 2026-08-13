const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const submitBtn = document.getElementById('submitBtn');

loginForm.addEventListener('submit', async (event) =>
{
  event.preventDefault();

  errorMessage.classList.remove('visible');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try
  {
    await apiRequest('/api/users/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    window.location.href = '/';
  }
  catch (err)
  {
    errorMessage.textContent = err.message;
    errorMessage.classList.add('visible');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
  }
});
