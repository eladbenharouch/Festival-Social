document.addEventListener('DOMContentLoaded', async () =>
{
  const navElement = document.getElementById('navLinks');

  try
  {
    const user = await apiRequest('/api/users/me');
    renderNav(navElement, user.user, 'map');
  }
  catch
  {
    renderNav(navElement, null, 'map');
  }
});

let map;

function initMap()
{
  map = new google.maps.Map(document.getElementById('map'),
  {
    center:
    {
      lat: 20,
      lng: 0
    },
    zoom: 2,
    mapId: 'DEMO_MAP_ID'
  });
  loadPostMarkers();
}
async function loadGoogleMaps()
{
  const response = await fetch('/api/maps-key');
  const data = await response.json();

  const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&callback=initMap&loading=async&libraries=marker`;
  script.async = true;
  script.defer = true;

  document.head.appendChild(script);
}
async function loadPostMarkers()
{
  const response = await fetch('/api/posts/feed');
  const data = await response.json();

  const infoWindow = new google.maps.InfoWindow();

  data.posts.forEach((post) =>
  {
    if (!post.location || !post.location.coordinates)
    {
      return;
    }

    const [lng, lat] = post.location.coordinates;

    const marker = new google.maps.marker.AdvancedMarkerElement(
{
  position: { lat, lng },
  map,
  title: post.title,
  gmpClickable: true
});

marker.addEventListener('gmp-click', () =>
{
  const content = document.createElement('div');
  content.style.maxWidth = '280px';
  content.style.padding = '6px';
  content.style.color = '#222';

      const title = document.createElement('h3');
      title.textContent = post.title;
      title.style.margin = '0 0 8px';

      const text = document.createElement('p');
      text.textContent = post.content || '';
      text.style.margin = '0 0 8px';

      const author = document.createElement('small');
      author.textContent = post.author?.username
        ? `Posted by ${post.author.username}`
        : '';

      content.appendChild(title);
      content.appendChild(text);
      content.appendChild(author);

      if (post.isLive)
      {
        const live = document.createElement('div');
        live.textContent = '🔴 LIVE';
        live.style.fontWeight = 'bold';
        live.style.marginTop = '8px';
        content.appendChild(live);
      }

      infoWindow.setContent(content);
      infoWindow.open(
      {
        map,
        anchor: marker
      });
    });
  });
}

loadGoogleMaps();