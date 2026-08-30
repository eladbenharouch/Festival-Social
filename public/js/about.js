async function init()
{
  const data = await getCurrentUser();
  renderNav(document.getElementById('navLinks'), data.user, 'about');
  renderAboutPage();
}

function renderAboutPage()
{
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-container">
      <h2 class="about-title">About Festival Social</h2>

      <div class="card-flat about-layout">
        <div class="about-main">
          <p class="about-text">
            Festival Social is a platform for festival-goers to share moments, discover events,
            and connect around the music and communities they love. Users can post updates from
            live events, join groups built around genres and festivals, search posts by location
            and category, and check real-time weather for their next event. Whether you're at a
            small local show or a massive weekend festival, Festival Social keeps the community
            connected in one place. Our goal is to make it easy to find people who share your
            taste in music, discover new groups, and never miss what's happening around you.
          </p>
        </div>

        <aside class="about-aside">
          <h3>Did you know?</h3>
          <ul>
            <li>Posts can be searched by genre, live status, and location together.</li>
            <li>Group statistics are calculated live from the database.</li>
            <li>Weather data comes from a real external API.</li>
          </ul>
        </aside>
      </div>

      <div class="card-flat">
        <h3>Project Intro</h3>
        <video controls width="480">
          <source src="/videos/intro.mp4" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>

      <div class="card-flat">
        <h3>Live Canvas Animation</h3>
        <canvas id="aboutCanvas" width="480" height="200"></canvas>
      </div>
    </div>
  `;

  startCanvasAnimation();
}

function startCanvasAnimation()
{
  const canvas = document.getElementById('aboutCanvas');
  const ctx = canvas.getContext('2d');

  const circles = [];
  for (let i = 0; i < 15; i++)
  {
    circles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 4 + Math.random() * 8,
      speedX: (Math.random() - 0.5) * 1.5,
      speedY: (Math.random() - 0.5) * 1.5,
      color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`
    });
  }

  function draw()
  {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const circle of circles)
    {
      circle.x += circle.speedX;
      circle.y += circle.speedY;

      if (circle.x < 0 || circle.x > canvas.width)
      {
        circle.speedX *= -1;
      }
      if (circle.y < 0 || circle.y > canvas.height)
      {
        circle.speedY *= -1;
      }

      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
      ctx.fillStyle = circle.color;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
}

init();