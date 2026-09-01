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
  setupEditGroupModal();

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
      editBtn.addEventListener('click', () => openEditGroupModal(group._id));
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
let editingGroupId = null;

async function openEditGroupModal(groupId) {
  editingGroupId = groupId;

  const modal = document.getElementById('editGroupModal');
  const errorEl = document.getElementById('editGroupError');
  const membersList = document.getElementById('editGroupMembersList');

  errorEl.classList.remove('visible');
  membersList.innerHTML = '<p>Loading...</p>';
  modal.hidden = false;

  try {
    const { group } = await apiRequest(`/api/groups/${groupId}`);

    document.getElementById('editGroupName').value = group.name;
    document.getElementById('editGroupCategory').value = group.category;
    document.getElementById('editGroupDescription').value = group.description || '';

    renderGroupMembersList(group);
  }
  catch (err) {
    showToast(err.message, 'error');
    modal.hidden = true;
  }
}

function renderGroupMembersList(group) {
  const container = document.getElementById('editGroupMembersList');
  const creatorId = group.creator && group.creator._id ? group.creator._id : group.creator;

  if (!group.members.length) {
    container.innerHTML = '<p class="empty-message">No members yet.</p>';
    return;
  }

  container.innerHTML = group.members.map((member) => {
    const isCreator = String(member._id) === String(creatorId);

    const avatar = member.avatarUrl
      ? `<img src="${escapeHtml(member.avatarUrl)}" alt="${escapeHtml(member.username)}" class="user-avatar">`
      : `<div class="user-avatar user-avatar-placeholder">${escapeHtml(member.username.charAt(0).toUpperCase())}</div>`;

    const removeBtn = isCreator
      ? ''
      : `<button class="remove-member-btn" title="Remove from group" data-member="${member._id}">🚪</button>`;

    return `
      <div class="user-row">
        <div class="user-main">
          ${avatar}
          <div class="user-info">
            <strong class="user-name">${escapeHtml(member.username)}${isCreator ? ' (owner)' : ''}</strong>
          </div>
        </div>
        ${removeBtn}
      </div>
    `;
  }).join('');

  container.querySelectorAll('.remove-member-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleRemoveMember(group._id, btn.dataset.member));
  });
}

async function handleRemoveMember(groupId, memberId) {
  try {
    const { group } = await apiRequest(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
    showToast('Member removed', 'success');
    renderGroupMembersList(group);
    await Promise.all([loadMyGroups(), loadAllGroups()]);
  }
  catch (err) {
    showToast(err.message, 'error');
  }
}

function setupEditGroupModal() {
  const modal = document.getElementById('editGroupModal');
  const form = document.getElementById('editGroupForm');
  const errorEl = document.getElementById('editGroupError');

  document.getElementById('closeEditGroupModalBtn').addEventListener('click', () => {
    modal.hidden = true;
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.hidden = true;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.classList.remove('visible');

    const name = document.getElementById('editGroupName').value.trim();
    const category = document.getElementById('editGroupCategory').value.trim();
    const description = document.getElementById('editGroupDescription').value.trim();

    try {
      await apiRequest(`/api/groups/${editingGroupId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ name, category, description })
        });

      showToast('Group updated!', 'success');
      modal.hidden = true;
      await Promise.all([loadMyGroups(), loadAllGroups()]);
    }
    catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.add('visible');
    }
  });
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
