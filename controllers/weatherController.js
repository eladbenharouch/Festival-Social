async function getWeather(req, res)
{
  try
  {
    const { city, lat, lng } = req.query;

    let latitude;
    let longitude;
    let locationName = 'Current location';
    let country = '';

    // Search by city name
    if (city)
    {
      const cityName = city.trim();

      if (cityName.length < 2)
      {
        return res.status(400).json({ error: 'Please enter a valid city name' });
      }

      const geocodingUrl =
        `https://geocoding-api.open-meteo.com/v1/search` +
        `?name=${encodeURIComponent(cityName)}` +
        `&count=1` +
        `&language=en` +
        `&format=json`;

      const geocodingResponse = await fetch(geocodingUrl);

      if (!geocodingResponse.ok)
      {
        return res.status(502).json(
        {
          error: 'Location service returned an error'
        });
      }

      const geocodingData = await geocodingResponse.json();

      if (
        !geocodingData.results ||
        geocodingData.results.length === 0
      )
      {
        return res.status(404).json(
        {
          error: 'Location not found'
        });
      }

      const location = geocodingData.results[0];

      latitude = location.latitude;
      longitude = location.longitude;
      locationName = location.name;
      country = location.country || '';
    }

    // Current browser location
    else if (lat !== undefined && lng !== undefined)
    {
      latitude = Number(lat);
      longitude = Number(lng);

      if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
      )
      {
        return res.status(400).json(
        {
          error: 'Invalid latitude or longitude'
        });
      }

      if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      )
      {
        return res.status(400).json(
        {
          error: 'Coordinates are out of range'
        });
      }
    }
    else
    {
      return res.status(400).json(
      {
        error: 'Please provide a city name or location coordinates'
      });
    }

    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
      `&timezone=auto` +
      `&forecast_days=7`;

    const response = await fetch(forecastUrl);

    if (!response.ok)
    {
      return res.status(502).json(
      {
        error: 'Weather service returned an error'
      });
    }

    const data = await response.json();

    if (!data.daily || !data.current)
    {
      return res.status(502).json(
      {
        error: 'Weather data is unavailable'
      });
    }

    const forecast = data.daily.time.map(
      (date, index) =>
      ({
        date,
        weatherCode:
          data.daily.weather_code[index],

        maxTemperature:
          data.daily.temperature_2m_max[index],

        minTemperature:
          data.daily.temperature_2m_min[index],

        precipitationProbability:
          data.daily.precipitation_probability_max[index],

        maxWindSpeed:
          data.daily.wind_speed_10m_max[index]
      })
    );

    return res.status(200).json(
    {
      location:
      {
        name: locationName,
        country,
        latitude,
        longitude
      },

      current:
      {
        temperature:
          data.current.temperature_2m,

        apparentTemperature:
          data.current.apparent_temperature,

        weatherCode:
          data.current.weather_code,

        windSpeed:
          data.current.wind_speed_10m,

        time:
          data.current.time
      },

      forecast
    });
  }
  catch (err)
  {
    console.error(
      'Get weather error:',
      err.message
    );

    return res.status(500).json(
    {
      error: 'Server error while fetching weather'
    });
  }
}

module.exports = { getWeather };