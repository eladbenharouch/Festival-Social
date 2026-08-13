const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');
const submitBtn = document.getElementById('submitBtn');

registerForm.addEventListener('submit', async (event) =>
{
  event.preventDefault();

  errorMessage.classList.remove('visible');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing up...';

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try
  {
    await apiRequest('/api/users/register',
    {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    window.location.href = '/';
  }
  catch (err)
  {
    errorMessage.textContent = err.message;
    errorMessage.classList.add('visible');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign Up';
  }
});
