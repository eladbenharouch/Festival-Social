async function getWeather(req, res)
{
  try
  {
    const { lat, lng } = req.query;

    if (lat === undefined || lng === undefined)
    {
      return res.status(400).json({ error: 'lat and lng query parameters are required' });
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (Number.isNaN(latNum) || Number.isNaN(lngNum))
    {
      return res.status(400).json({ error: 'Invalid lat/lng values' });
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lngNum}&current_weather=true`;

    const response = await fetch(url);

    if (!response.ok)
    {
      return res.status(502).json({ error: 'Weather service returned an error' });
    }

    const data = await response.json();
    const current = data.current_weather;

    return res.status(200).json(
    {
      temperature: current.temperature,
      windspeed: current.windspeed,
      weatherCode: current.weathercode,
      time: current.time
    });
  }
  catch (err)
  {
    console.error('Get weather error:', err.message);
    return res.status(500).json({ error: 'Server error while fetching weather' });
  }
}

module.exports = { getWeather };