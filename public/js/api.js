async function apiRequest(url, options = {})
{
  const response = await fetch(url,
  {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok)
  {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

function getCurrentUser()
{
  return apiRequest('/api/users/me').catch(() => null);
}
