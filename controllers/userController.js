const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Group = require('../models/Group');

function escapeRegex(text)
{
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function register(req, res)
{
  try
  {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
    {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUsername)
    {
      return res.status(400).json({ error: 'Username cannot be empty' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail))
    {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (password.length < 6)
    {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ $or: [{ username: trimmedUsername }, { email: trimmedEmail }] });

    if (existingUser)
    {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    const user = await User.create({ username: trimmedUsername, email: trimmedEmail, password });

    req.session.userId = user._id.toString();

    return res.status(201).json({ user: user.toSafeObject() });
  }
  catch (err)
  {
    console.error('Registration error:', err.message);
    return res.status(500).json({ error: 'Server error during registration' });
  }
}

async function login(req, res)
{
  try
  {
    const { username, password } = req.body;

    if (!username || !password)
    {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ $or: [{ username }, { email: username }] });

    if (!user)
    {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch)
    {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.userId = user._id.toString();

    return res.status(200).json({ user: user.toSafeObject() });
  }
  catch (err)
  {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Server error during login' });
  }
}

function logout(req, res)
{
  req.session.destroy((err) =>
  {
    if (err)
    {
      console.error('Logout error:', err.message);
      return res.status(500).json({ error: 'Server error during logout' });
    }

    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
}

async function getCurrentUser(req, res)
{
  try
  {
    if (!req.session.userId)
    {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const user = await User.findById(req.session.userId);

    if (!user)
    {
      return res.status(401).json({ error: 'Not logged in' });
    }

    return res.status(200).json({ user: user.toSafeObject() });
  }
  catch (err)
  {
    console.error('Get current user error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getMyFollowing(req, res)
{
  try
  {
    const user = await User.findById(req.session.userId)
      .populate('following', 'username avatarUrl favoriteGenres');

    if (!user)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      following: user.following
    });
  }
  catch (err)
  {
    console.error('Get following error:', err.message);
    return res.status(500).json({
      error: 'Server error while fetching following list'
    });
  }
}
async function getMyFollowers(req, res)
{
  try
  {
    const followers = await User.find({
      following: req.session.userId
    }).select('username avatarUrl favoriteGenres');

    return res.status(200).json({
      followers
    });
  }
  catch (err)
  {
    console.error('Get followers error:', err.message);
    return res.status(500).json({
      error: 'Server error while fetching followers list'
    });
  }
}

async function followUser(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (id === req.session.userId)
    {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const target = await User.findById(id);

    if (!target)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    const current = await User.findById(req.session.userId);

    if (current.following.some((followedId) => followedId.toString() === id))
    {
      return res.status(400).json({ error: 'You are already following this user' });
    }

    await User.findByIdAndUpdate(req.session.userId, { $addToSet: { following: id } });

    return res.status(200).json({ message: 'You are now following this user' });
  }
  catch (err)
  {
    console.error('Follow user error:', err.message);
    return res.status(500).json({ error: 'Server error while following user' });
  }
}

async function unfollowUser(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const target = await User.findById(id);

    if (!target)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    const current = await User.findById(req.session.userId);

    if (!current.following.some((followedId) => followedId.toString() === id))
    {
      return res.status(400).json({ error: 'You are not following this user' });
    }

    await User.findByIdAndUpdate(req.session.userId, { $pull: { following: id } });

    return res.status(200).json({ message: 'You have unfollowed this user' });
  }
  catch (err)
  {
    console.error('Unfollow user error:', err.message);
    return res.status(500).json({ error: 'Server error while unfollowing user' });
  }
}
async function getAllUsers(req, res)
{
  try
  {
    const users = await User.find()
      .select('username email avatarUrl favoriteGenres')
      .sort({ username: 1 });

    return res.status(200).json({ users });
  }
  catch (err)
  {
    console.error('Get users error:', err.message);
    return res.status(500).json({ error: 'Server error while fetching users' });
  }
}

async function searchUsers(req, res)
{
  try
  {
    const { username, email, genre } = req.query;

    const filter = {};

        if (username)
    {
      filter.username = { $regex: escapeRegex(username), $options: 'i' };
    }

    if (email)
    {
      filter.email = { $regex: escapeRegex(email), $options: 'i' };
    }

    if (genre)
    {
      filter.favoriteGenres = { $regex: escapeRegex(genre), $options: 'i' };
    }

    const users = await User.find(filter)
      .select('username email avatarUrl favoriteGenres')
      .sort({ username: 1 });

    return res.status(200).json({ users });
  }
  catch (err)
  {
    console.error('Search users error:', err.message);
    return res.status(500).json({ error: 'Server error while searching users' });
  }
}

async function updateCurrentUser(req, res)
{
  try
  {
    const user = await User.findById(req.session.userId);

    if (!user)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    const { username, email, password, avatarUrl, favoriteGenres } = req.body;

    if (username !== undefined)
    {
      user.username = username.trim();
    }

    if (email !== undefined)
    {
      user.email = email.trim().toLowerCase();
    }

    if (avatarUrl !== undefined)
    {
      user.avatarUrl = avatarUrl.trim();
    }

    if (favoriteGenres !== undefined)
    {
      user.favoriteGenres = Array.isArray(favoriteGenres)
        ? favoriteGenres
        : [];
    }

    if (password)
    {
      if (password.length < 6)
      {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      user.password = password;
    }

    await user.save();

    return res.status(200).json({ user: user.toSafeObject() });
  }
  catch (err)
  {
    if (err.code === 11000)
    {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    console.error('Update user error:', err.message);
    return res.status(500).json({ error: 'Server error while updating user' });
  }
}

async function deleteCurrentUser(req, res)
{
  try
  {
    const userId = req.session.userId;

    const user = await User.findById(userId);

    if (!user)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    const ownedGroups = await Group.find({ creator: userId }).select('_id');
    const ownedGroupIds = ownedGroups.map((group) => group._id);

    await Post.deleteMany({ author: userId });

    if (ownedGroupIds.length)
    {
      await Post.updateMany({ group: { $in: ownedGroupIds } }, { $set: { group: null } });
      await Group.deleteMany({ _id: { $in: ownedGroupIds } });
    }

    await Group.updateMany({}, { $pull: { members: userId } });
    await User.updateMany({}, { $pull: { following: userId } });
    await Post.updateMany({}, { $pull: { likedBy: userId } });

    await User.findByIdAndDelete(userId);

    req.session.destroy((err) =>
    {
      if (err)
      {
        console.error('Delete user session error:', err.message);
        return res.status(500).json({ error: 'User deleted, but session cleanup failed' });
      }

      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'User deleted successfully' });
    });
  }
  catch (err)
  {
    console.error('Delete user error:', err.message);
    return res.status(500).json({ error: 'Server error while deleting user' });
  }
}

async function getMyProfileStats(req, res)
{
  try
  {
    const userId = req.session.userId;

    const user = await User.findById(userId).select('following');

    if (!user)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    const [postsCount, followersCount] = await Promise.all([
      Post.countDocuments({ author: userId }),
      User.countDocuments({ following: userId })
    ]);

    return res.status(200).json({
      postsCount,
      followersCount,
      followingCount: user.following.length
    });
  }
  catch (err)
  {
    console.error('Get profile stats error:', err.message);
    return res.status(500).json({ error: 'Server error while fetching profile stats' });
  }
}
async function getUserProfile(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await User.findById(req.params.id)
      .select('username avatarUrl favoriteGenres following');

    if (!user)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    const [postsCount, followersCount] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      User.countDocuments({ following: user._id })
    ]);

    const currentUser = await User.findById(req.session.userId)
      .select('following');

    const isFollowing = currentUser
      ? currentUser.following.some(
          (id) => String(id) === String(user._id)
        )
      : false;

    return res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        favoriteGenres: user.favoriteGenres
      },
      stats: {
        postsCount,
        followersCount,
        followingCount: user.following.length
      },
      isFollowing
    });
  }
  catch (err)
  {
    console.error('Get user profile error:', err.message);
    return res.status(500).json({
      error: 'Server error while fetching user profile'
    });
  }
}
async function getUserFollowers(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const followers = await User.find({
      following: req.params.id
    })
      .select('username avatarUrl favoriteGenres')
      .sort({ username: 1 });

    return res.status(200).json({
      followers
    });
  }
  catch (err)
  {
    console.error('Get user followers error:', err.message);
    return res.status(500).json({
      error: 'Server error while fetching user followers'
    });
  }
}

async function getUserFollowing(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await User.findById(req.params.id)
      .populate('following', 'username avatarUrl favoriteGenres');

    if (!user)
    {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    return res.status(200).json({
      following: user.following
    });
  }
  catch (err)
  {
    console.error('Get user following error:', err.message);
    return res.status(500).json({
      error: 'Server error while fetching user following'
    });
  }
}
module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  getMyFollowing,
  getMyFollowers,
  followUser,
  unfollowUser,
  getAllUsers,
  searchUsers,
  updateCurrentUser,
  deleteCurrentUser,
  getMyProfileStats,
  getUserProfile,
  getUserFollowers,
  getUserFollowing
};