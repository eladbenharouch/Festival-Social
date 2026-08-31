let currentUser = null;
let currentFilters = {};
let toastTimer = null;

async function init() {
  const result = await getCurrentUser();

  if (!result || !result.user) {
    window.location.href = '/login.html';
    return;
  }

  currentUser = result.user;
  renderNav(document.getElementById('navLinks'), currentUser, 'groups');

  setupCreateForm();
  setupSearch();

  await Promise.all([loadMyGroups(), loadAllGroups()]);
}

async function loadMyGroups() {
  try {
    const { groups } = await apiRequest('/api/groups/mine');
    renderGroupGrid(document.getElementById('myGroupsGrid'), groups, "You haven't joined any groups yet.");
  }
  catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAllGroups(filters = currentFilters) {
  const params = new URLSearchParams();

  if (filters.name) {
    params.set('name', filters.name);
  }

  if (filters.category) {
    params.set('category', filters.category);
  }

  if (filters.sortBy) {
    params.set('sortBy', filters.sortBy);
  }

  const query = params.toString();
  const { groups } = await apiRequest(`/api/groups${query ? '?' + query : ''}`);
  renderGroupGrid(document.getElementById('allGroupsGrid'), groups, 'No groups found.');
}

function renderGroupGrid(container, groups, emptyMessage) {
  if (!groups.length) {
    container.innerHTML = `<p class="empty-message">${emptyMessage}</p>`;
    return;
  }

  container.innerHTML = groups.map((group) => groupCardHtml(group)).join('');

  groups.forEach((group) => {
    const joinBtn = container.querySelector(`[data-join="${group._id}"]`);
    const leaveBtn = container.querySelector(`[data-leave="${group._id}"]`);
    const editBtn = container.querySelector(`[data-edit="${group._id}"]`);
    const deleteBtn = container.querySelector(`[data-delete="${group._id}"]`);
    if (joinBtn) {
      joinBtn.addEventListener('click', () => handleJoin(group._id));
    }

    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => handleLeave(group._id));
    }

    if (editBtn) {
      editBtn.addEventListener('click', () => handleEdit(group));
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => handleDelete(group._id));
    }
  });
}

function groupCardHtml(group) {
  const creatorId = group.creator && group.creator._id ? group.creator._id : group.creator;
  const creatorName = group.creator && group.creator.username ? group.creator.username : 'Unknown';
  const isCreator = creatorId === currentUser.id;
  const members = Array.isArray(group.members) ? group.members : [];
  const isMember = members.some((member) => (member._id || member) === currentUser.id);
  const memberCount = members.length;

  let actionsHtml;

  if (isCreator) {
    actionsHtml = `
    <button class="btn-small btn-outline" data-edit="${group._id}">Edit</button>
    <button class="btn-small btn-danger" data-delete="${group._id}">Delete</button>
  `;
  }
  else if (isMember) {
    actionsHtml = `<button class="btn-small btn-outline" data-leave="${group._id}">Leave</button>`;
  }
  else {
    actionsHtml = `<button class="btn-small primary-btn" data-join="${group._id}">Join</button>`;
  }

  return `
    <article class="group-card">
      <span class="category-badge">${escapeHtml(group.category)}</span>
      <h3>${escapeHtml(group.name)}</h3>
      <p class="meta">${escapeHtml(group.description || 'No description')}</p>
      <p class="meta">Created by ${escapeHtml(creatorName)} &middot; ${memberCount} member${memberCount === 1 ? '' : 's'}</p>
      <div class="actions">${actionsHtml}</div>
    </article>
  `;
}

async function handleJoin(groupId) {
  try {
    await apiRequest(`/api/groups/${groupId}/join`, { method: 'POST' });
    showToast('Joined group!', 'success');
    await Promise.all([loadMyGroups(), loadAllGroups()]);
  }
  catch (err) {
    showToast(err.message, 'error');
  }
}
async function handleEdit(group) {
  const newName = prompt('Group name:', group.name);
  if (newName === null) {
    return;
  }

  const newCategory = prompt('Category:', group.category);
  if (newCategory === null) {
    return;
  }

  const newDescription = prompt('Description:', group.description || '');
  if (newDescription === null) {
    return;
  }

  const name = newName.trim();
  const category = newCategory.trim();
  const description = newDescription.trim();

      if (!name && !category)
   {
    showToast('Name and category are required', 'error');
    return;
    }

  if (!name) 
    {
    showToast('Group name is required', 'error');
    return;
  }

  if (!category) 
    {
    showToast('Category is required', 'error');
    return;
  }

  try 
  {
    await apiRequest(`/api/groups/${group._id}`,
      {
        method: 'PUT',
        body: JSON.stringify(
          {
            name,
            category,
            description
          })
      });

    showToast('Group updated!', 'success');
    await Promise.all([loadMyGroups(), loadAllGroups()]);
  }
  catch (err) 
  {
    showToast(err.message, 'error');
  }
}
async function handleLeave(groupId) {
  try {
    await apiRequest(`/api/groups/${groupId}/leave`, { method: 'POST' });
    showToast('Left the group', 'success');
    await Promise.all([loadMyGroups(), loadAllGroups()]);
  }
  catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDelete(groupId) {
  try {
    await apiRequest(`/api/groups/${groupId}`, { method: 'DELETE' });
    showToast('Group deleted', 'success');
    await Promise.all([loadMyGroups(), loadAllGroups()]);
  }
  catch (err) {
    showToast(err.message, 'error');
  }
}

function setupCreateForm() {
  const form = document.getElementById('createGroupForm');
  const errorEl = document.getElementById('createError');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.classList.remove('visible');

    const name = document.getElementById('groupName').value.trim();
    const category = document.getElementById('groupCategory').value.trim();
    const description = document.getElementById('groupDescription').value.trim();

    try {
      await apiRequest('/api/groups',
        {
          method: 'POST',
          body: JSON.stringify({ name, category, description })
        });

      form.reset();
      showToast('Group created!', 'success');
      await Promise.all([loadMyGroups(), loadAllGroups()]);
    }
    catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.add('visible');
    }
  });
}

function setupSearch() {
  document.getElementById('searchBtn').addEventListener('click', async (event) => {
    event.preventDefault();

    currentFilters =
    {
      name: document.getElementById('filterName').value.trim(),
      category: document.getElementById('filterCategory').value.trim(),
      sortBy: document.getElementById('filterSortBy').value
    };

    await loadAllGroups(currentFilters);
  });
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast visible ${type}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

init();
