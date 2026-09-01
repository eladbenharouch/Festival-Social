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
      <h2>Festival Weather</h2>

      <p>
        Search for a city and check the current weather and 7-day forecast.
      </p>

      <form id="cityWeatherForm" class="inline-form">
        <div class="field">
          <label for="weatherCity">City</label>
          <input
            type="text"
            id="weatherCity"
            placeholder="e.g. Tel Aviv, Berlin, Madrid"
            autocomplete="off"
            required
          >
        </div>

        <button type="submit" class="primary-btn btn-small">
          Search Weather
        </button>
      </form>

      <div class="weather-location-option">
        <span>or</span>

        <button
          type="button"
          class="secondary-btn btn-small"
          id="useLocationBtn"
        >
          Use my current location
        </button>
      </div>

      <p class="error-message" id="weatherError"></p>

      <div id="weatherResult"></div>
    </section>
  `;

  document
    .getElementById('cityWeatherForm')
    .addEventListener('submit', handleCitySubmit);

  document
    .getElementById('useLocationBtn')
    .addEventListener('click', handleUseLocation);
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
      (position) =>
      {
        resolve(
        {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },

     (error) =>
{
  if (error.code === 1)
  {
    reject(new Error(
      'Location permission was denied. Please search by city instead.'
    ));
  }
  else if (error.code === 2)
  {
    reject(new Error(
      'Your current location is temporarily unavailable. Please search by city instead.'
    ));
  }
  else
  {
    reject(new Error(
      'Unable to detect your location. Please search by city instead.'
    ));
  }
}
    );
  });
}

async function handleCitySubmit(event)
{
  event.preventDefault();

  const city = document
    .getElementById('weatherCity')
    .value
    .trim();

  clearWeatherError();

  if (city.length < 2)
  {
    showWeatherError('Please enter a valid city name');
    return;
  }

  await loadWeather(`/api/weather?city=${encodeURIComponent(city)}`);
}

async function handleUseLocation()
{
  clearWeatherError();

  const button = document.getElementById('useLocationBtn');

  button.disabled = true;
  button.textContent = 'Getting location...';

  try
  {
    const coords = await getCurrentCoords();

    await loadWeather(
      `/api/weather?lat=${encodeURIComponent(coords.lat)}&lng=${encodeURIComponent(coords.lng)}`
    );
  }
  catch (err)
  {
    showWeatherError(
      err.message || 'Unable to detect your location'
    );
  }
  finally
  {
    button.disabled = false;
    button.textContent = 'Use my current location';
  }
}

async function loadWeather(url)
{
  const resultEl = document.getElementById('weatherResult');

  clearWeatherError();

  resultEl.innerHTML = `
    <div class="card-flat">
      <p>Loading weather...</p>
    </div>
  `;

  try
  {
    const weather = await apiRequest(url);

    clearWeatherError();

    renderForecast(weather);
  }
  catch (err)
  {
    resultEl.innerHTML = '';

    showWeatherError(
      err.message || 'Unable to load weather'
    );
  }
}

function renderForecast(weather)
{
  const resultEl = document.getElementById('weatherResult');

  const locationName = weather.location.country
    ? `${weather.location.name}, ${weather.location.country}`
    : weather.location.name;

  const currentInfo = getWeatherInfo(
    weather.current.weatherCode
  );

  const forecastCards = weather.forecast
    .map((day, index) =>
    {
      const date = new Date(`${day.date}T12:00:00`);

      const dayName = index === 0
        ? 'Today'
        : date.toLocaleDateString(
          'en-US',
          {
            weekday: 'long'
          }
        );

      const formattedDate = date.toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric'
        }
      );

      const weatherInfo = getWeatherInfo(
        day.weatherCode
      );

      return `
        <article class="weather-day-card">

          <div class="weather-day-header">
            <strong>${dayName}</strong>
            <span>${formattedDate}</span>
          </div>

          <div class="weather-icon">
            ${weatherInfo.icon}
          </div>

          <strong class="weather-description">
            ${weatherInfo.description}
          </strong>

          <div class="weather-temperatures">
            <span class="weather-max">
              ${Math.round(day.maxTemperature)}&deg;
            </span>

            <span class="weather-min">
              ${Math.round(day.minTemperature)}&deg;
            </span>
          </div>

          <div class="weather-details">
            <span>
              Rain:
              ${day.precipitationProbability ?? 0}%
            </span>

            <span>
              Wind:
              ${Math.round(day.maxWindSpeed)} km/h
            </span>
          </div>

        </article>
      `;
    })
    .join('');

  resultEl.innerHTML = `
    <section class="weather-forecast">

      <div class="weather-forecast-header">
        <p class="weather-label">
          Weather
        </p>

        <h3>
          Weather in ${locationName}
        </h3>
      </div>

      <div class="card-flat">
        <p class="weather-label">
          Current Weather
        </p>

        <div style="
          display:flex;
          align-items:center;
          gap:18px;
          margin-top:10px;
        ">

          <div style="font-size:3rem;">
            ${currentInfo.icon}
          </div>

          <div>
            <h3>
              ${currentInfo.description}
            </h3>

            <p style="font-size:2rem;font-weight:bold;">
              ${Math.round(weather.current.temperature)}&deg;C
            </p>

            <p>
              Feels like:
              ${Math.round(weather.current.apparentTemperature)}&deg;C
            </p>

            <p>
              Wind:
              ${Math.round(weather.current.windSpeed)} km/h
            </p>
          </div>

        </div>
      </div>

      <p
        class="weather-label"
        style="margin-top:28px;"
      >
        7-Day Forecast
      </p>

      <div class="weather-days-grid">
        ${forecastCards}
      </div>

    </section>
  `;
}

function getWeatherInfo(code)
{
  if (code === 0)
  {
    return {
      icon: '☀️',
      description: 'Clear sky'
    };
  }

  if ([1, 2].includes(code))
  {
    return {
      icon: '🌤️',
      description: 'Partly cloudy'
    };
  }

  if (code === 3)
  {
    return {
      icon: '☁️',
      description: 'Cloudy'
    };
  }

  if ([45, 48].includes(code))
  {
    return {
      icon: '🌫️',
      description: 'Fog'
    };
  }

  if ([51, 53, 55, 56, 57].includes(code))
  {
    return {
      icon: '🌦️',
      description: 'Drizzle'
    };
  }

  if (
    [61, 63, 65, 66, 67, 80, 81, 82]
      .includes(code)
  )
  {
    return {
      icon: '🌧️',
      description: 'Rain'
    };
  }

  if (
    [71, 73, 75, 77, 85, 86]
      .includes(code)
  )
  {
    return {
      icon: '❄️',
      description: 'Snow'
    };
  }

  if ([95, 96, 99].includes(code))
  {
    return {
      icon: '⛈️',
      description: 'Thunderstorm'
    };
  }

  return {
    icon: '🌤️',
    description: 'Mixed weather'
  };
}

function clearWeatherError()
{
  const errorEl =
    document.getElementById('weatherError');

  errorEl.textContent = '';
  errorEl.classList.remove('visible');
}

function showWeatherError(message)
{
  const errorEl =
    document.getElementById('weatherError');

  errorEl.textContent = message;
  errorEl.classList.add('visible');
}

init();