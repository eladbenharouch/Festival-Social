const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');

function escapeRegex(text)
{
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isMember(group, userId)
{
  return group.members.some((memberId) => memberId.toString() === userId);
}

function validateGroupFields(name, description, category)
{
  if (name !== undefined && name.trim().length === 0)
  {
    return 'Group name cannot be empty';
  }

  if (name !== undefined && name.trim().length > 20)
  {
    return 'Group name must be 20 characters or fewer';
  }

  if (category !== undefined && category.trim().length === 0)
  {
    return 'Category cannot be empty';
  }

  if (category !== undefined && category.trim().length > 30)
  {
    return 'Category must be 30 characters or fewer';
  }

  if (description !== undefined && description.length > 300)
  {
    return 'Description must be 300 characters or fewer';
  }

  return null;
}

async function createGroup(req, res)
{
  try
  {
    const { name, description, category } = req.body;

        if (!name && !category)
    {
      return res.status(400).json({ error: 'Group name and category are required' });
    }

    if (!name)
    {
      return res.status(400).json({ error: 'Group name is required' });
    }

    if (!category)
    {
      return res.status(400).json({ error: 'Category is required' });
    }

    const validationError = validateGroupFields(name, description, category);

    if (validationError)
    {
      return res.status(400).json({ error: validationError });
    }

    const group = await Group.create(
    {
      name: name.trim(),
      description: description ? description.trim() : '',
      category: category.trim(),
      creator: req.session.userId,
      members: [req.session.userId]
    });

    await User.findByIdAndUpdate(req.session.userId, { $addToSet: { groups: group._id } });

    return res.status(201).json({ group });
  }
  catch (err)
  {
    console.error('Create group error:', err.message);
    return res.status(500).json({ error: 'Server error while creating group' });
  }
}

async function listGroups(req, res)
{
  try
  {
    const { category, name, sortBy } = req.query;
    const filter = {};

    if (category)
    {
      filter.category = new RegExp(escapeRegex(category), 'i');
    }

    if (name)
    {
      filter.name = new RegExp(escapeRegex(name), 'i');
    }

    const sortOption = sortBy === 'popular' ? { memberCount: -1 } : { createdAt: -1 };

    const groups = await Group.find(filter)
      .populate('creator', 'username')
      .sort(sortOption);

    return res.status(200).json({ groups });
  }
  catch (err)
  {
    console.error('List groups error:', err.message);
    return res.status(500).json({ error: 'Server error while listing groups' });
  }
}

async function getMyGroups(req, res)
{
  try
  {
    const groups = await Group.find({ members: req.session.userId })
      .populate('creator', 'username')
      .sort({ createdAt: -1 });

    return res.status(200).json({ groups });
  }
  catch (err)
  {
    console.error('Get my groups error:', err.message);
    return res.status(500).json({ error: 'Server error while fetching your groups' });
  }
}

async function getGroupById(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid group id' });
    }

    const group = await Group.findById(id)
      .populate('creator', 'username')
      .populate('members', 'username');

    if (!group)
    {
      return res.status(404).json({ error: 'Group not found' });
    }

    return res.status(200).json({ group });
  }
  catch (err)
  {
    console.error('Get group error:', err.message);
    return res.status(500).json({ error: 'Server error while fetching group' });
  }
}

async function updateGroup(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid group id' });
    }

    const group = await Group.findById(id);

    if (!group)
    {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creator.toString() !== req.session.userId)
    {
      return res.status(403).json({ error: 'Only the group creator can update this group' });
    }

    const { name, description, category } = req.body;

    const validationError = validateGroupFields(name, description, category);

    if (validationError)
    {
      return res.status(400).json({ error: validationError });
    }

    if (name)
    {
      group.name = name.trim();
    }

    if (description !== undefined)
    {
      group.description = description.trim();
    }

    if (category)
    {
      group.category = category.trim();
    }

    await group.save();

    return res.status(200).json({ group });
  }
  catch (err)
  {
    console.error('Update group error:', err.message);
    return res.status(500).json({ error: 'Server error while updating group' });
  }
}

async function deleteGroup(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid group id' });
    }

    const group = await Group.findById(id);

    if (!group)
    {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creator.toString() !== req.session.userId)
    {
      return res.status(403).json({ error: 'Only the group creator can delete this group' });
    }

    await User.updateMany({ groups: group._id }, { $pull: { groups: group._id } });
    await group.deleteOne();

    return res.status(200).json({ message: 'Group deleted successfully' });
  }
  catch (err)
  {
    console.error('Delete group error:', err.message);
    return res.status(500).json({ error: 'Server error while deleting group' });
  }
}

async function joinGroup(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid group id' });
    }

    const group = await Group.findById(id);

    if (!group)
    {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (isMember(group, req.session.userId))
    {
      return res.status(400).json({ error: 'You are already a member of this group' });
    }

    group.members.push(req.session.userId);
    group.memberCount = group.members.length;
    await group.save();
    await User.findByIdAndUpdate(req.session.userId, { $addToSet: { groups: group._id } });

    return res.status(200).json({ group });
  }
  catch (err)
  {
    console.error('Join group error:', err.message);
    return res.status(500).json({ error: 'Server error while joining group' });
  }
}

async function leaveGroup(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid group id' });
    }

    const group = await Group.findById(id);

    if (!group)
    {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creator.toString() === req.session.userId)
    {
      return res.status(400).json({ error: 'The group creator cannot leave the group. Delete it instead.' });
    }

    if (!isMember(group, req.session.userId))
    {
      return res.status(400).json({ error: 'You are not a member of this group' });
    }

    group.members = group.members.filter((memberId) => memberId.toString() !== req.session.userId);
    group.memberCount = group.members.length;
    await group.save();
    await User.findByIdAndUpdate(req.session.userId, { $pull: { groups: group._id } });

    return res.status(200).json({ group });
  }
  catch (err)
  {
    console.error('Leave group error:', err.message);
    return res.status(500).json({ error: 'Server error while leaving group' });
  }
}

module.exports =
{
  createGroup,
  listGroups,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup
};
