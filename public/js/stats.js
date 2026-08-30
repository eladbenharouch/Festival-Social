async function init()
{
  const data = await getCurrentUser();
  renderNav(document.getElementById('navLinks'), data.user, 'stats');
  renderStatsPage();
}

function renderStatsPage()
{
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="page-container">
      <h2>סטטיסטיקות</h2>

      <div class="card-flat">
        <h3>פוסטים לפי ז'אנר</h3>
        <div id="genreChart"></div>
      </div>

      <div class="card-flat">
        <h3>פוסטים לפי קבוצה</h3>
        <div id="groupChart"></div>
      </div>
    </div>
  `;

  loadGenreStats();
  loadGroupStats();
}

async function loadGenreStats()
{
  try
  {
    const data = await apiRequest('/api/stats/posts-by-genre');
    drawBarChart(data.stats, 'genreChart', 'genre', 'postCount');
  }
  catch (err)
  {
    console.error('Load genre stats error:', err.message);
    document.getElementById('genreChart').innerHTML = '<p>שגיאה בטעינת הנתונים</p>';
  }
}

async function loadGroupStats()
{
  try
  {
    const data = await apiRequest('/api/stats/posts-by-group');
    drawPieChart(data.stats, 'groupChart', 'groupName', 'postCount');
  }
  catch (err)
  {
    console.error('Load group stats error:', err.message);
    document.getElementById('groupChart').innerHTML = '<p>שגיאה בטעינת הנתונים</p>';
  }
}

function drawBarChart(data, containerId, labelKey, valueKey)
{
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (!data || data.length === 0)
  {
    container.innerHTML = '<p>אין נתונים להצגה</p>';
    return;
  }

  const width = 500;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 60, left: 50 };

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const x = d3.scaleBand()
    .domain(data.map(d => d[labelKey]))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[valueKey])])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end');

  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y).ticks(5));

  svg.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d[labelKey]))
    .attr('y', d => y(d[valueKey]))
    .attr('width', x.bandwidth())
    .attr('height', d => height - margin.bottom - y(d[valueKey]))
    .attr('fill', '#4a90d9');
}

function drawPieChart(data, containerId, labelKey, valueKey)
{
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (!data || data.length === 0)
  {
    container.innerHTML = '<p>אין נתונים להצגה</p>';
    return;
  }

  const width = 400;
  const height = 400;
  const radius = Math.min(width, height) / 2 - 40;

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const pie = d3.pie().value(d => d[valueKey]);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);
  const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.6);

  const arcs = svg.selectAll('.arc')
    .data(pie(data))
    .enter()
    .append('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => color(i));

  arcs.append('text')
    .attr('transform', d => `translate(${labelArc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(d => d.data[labelKey]);
}

init();