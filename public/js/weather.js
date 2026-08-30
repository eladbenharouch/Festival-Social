const navLinks = document.getElementById('navLinks');
const content = document.getElementById('content');

async function init()
{
  const result = await getCurrentUser();
  const user = result && result.user ? result.user : null;

  renderNav(navLinks, user, 'weather');

  if (!user)
  {
    content.innerHTML = '<p>You must be logged in to check the weather.</p>';
    return;
  }

  renderWeatherPage();
}

function renderWeatherPage()
{
  content.classList.remove('card');
  content.classList.add('page-container');

  content.innerHTML = `
    <section class="card-flat">
      <h2>Festival Weather Check</h2>
      <p>Check the current weather at your location, or enter coordinates manually.</p>
      <button class="primary-btn btn-small" id="useLocationBtn">Use my current location</button>
      <form id="manualLocationForm" class="inline-form">
        <div class="field">
          <label for="weatherLat">Latitude</label>
          <input type="text" id="weatherLat" placeholder="e.g. 32.0853">
        </div>
        <div class="field">
          <label for="weatherLng">Longitude</label>
          <input type="text" id="weatherLng" placeholder="e.g. 34.7818">
        </div>
        <button type="submit" class="btn-small primary-btn">Check Weather</button>
      </form>
      <p class="error-message" id="weatherError"></p>
      <div id="weatherResult"></div>
    </section>
  `;

  document.getElementById('useLocationBtn').addEventListener('click', handleUseLocation);
  document.getElementById('manualLocationForm').addEventListener('submit', handleManualSubmit);
}

function getCurrentCoords()
{
  return new Promise((resolve, reject) =>
  {
    if (!navigator.geolocation)
    {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(new Error(error.message))
    );
  });
}

async function handleUseLocation()
{
  const errorEl = document.getElementById('weatherError');
  errorEl.classList.remove('visible');

  try
  {
    const coords = await getCurrentCoords();
    await loadWeather(coords.lat, coords.lng);
  }
  catch (err)
  {
    errorEl.textContent = err.message;
    errorEl.classList.add('visible');
  }
}

async function handleManualSubmit(event)
{
  event.preventDefault();

  const errorEl = document.getElementById('weatherError');
  errorEl.classList.remove('visible');

  const lat = document.getElementById('weatherLat').value.trim();
  const lng = document.getElementById('weatherLng').value.trim();

  if (!lat || !lng)
  {
    errorEl.textContent = 'Please enter both latitude and longitude';
    errorEl.classList.add('visible');
    return;
  }

  await loadWeather(lat, lng);
}

async function loadWeather(lat, lng)
{
  const errorEl = document.getElementById('weatherError');
  const resultEl = document.getElementById('weatherResult');

  try
  {
    const weather = await apiRequest(`/api/weather?lat=${lat}&lng=${lng}`);

    resultEl.innerHTML = `
      <div class="card-flat">
        <p><strong>Temperature:</strong> ${weather.temperature}&deg;C</p>
        <p><strong>Wind speed:</strong> ${weather.windspeed} km/h</p>
        <p><strong>Last updated:</strong> ${new Date(weather.time).toLocaleString()}</p>
      </div>
    `;
  }
  catch (err)
  {
    errorEl.textContent = err.message;
    errorEl.classList.add('visible');
  }
}

init();