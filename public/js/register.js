const registerForm =
  document.getElementById('registerForm');

const errorMessage =
  document.getElementById('errorMessage');

const submitBtn =
  document.getElementById('submitBtn');

registerForm.addEventListener(
  'submit',
  async (event) =>
  {
    event.preventDefault();

    errorMessage.classList.remove(
      'visible'
    );

    const username =
      document
        .getElementById('username')
        .value
        .trim();

    const email =
      document
        .getElementById('email')
        .value
        .trim();

    const password =
      document
        .getElementById('password')
        .value;

    const favoriteGenres =
      Array.from(
        document.querySelectorAll(
          'input[name="favoriteGenres"]:checked'
        )
      ).map(
        checkbox => checkbox.value
      );

    if (favoriteGenres.length === 0)
    {
      errorMessage.textContent =
        'Please choose at least one music genre';

      errorMessage.classList.add(
        'visible'
      );

      return;
    }

    submitBtn.disabled = true;

    submitBtn.textContent =
      'Signing up...';

    try
    {
      await apiRequest(
        '/api/users/register',
        {
          method: 'POST',

          body: JSON.stringify(
          {
            username,
            email,
            password,
            favoriteGenres
          })
        }
      );

      window.location.href = '/';
    }
    catch (err)
    {
      errorMessage.textContent =
        err.message;

      errorMessage.classList.add(
        'visible'
      );

      submitBtn.disabled = false;

      submitBtn.textContent =
        'Sign Up';
    }
  }
);