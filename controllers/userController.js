const mongoose = require('mongoose');
const User = require('../models/User');

async function register(req, res)
{
  try
  {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
    {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    if (password.length < 6)
    {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser)
    {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    const user = await User.create({ username, email, password });

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
    const user = await User.findById(req.session.userId).select('following');
    return res.status(200).json({ following: user.following });
  }
  catch (err)
  {
    console.error('Get following error:', err.message);
    return res.status(500).json({ error: 'Server error while fetching following list' });
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

module.exports = { register, login, logout, getCurrentUser, getMyFollowing, followUser, unfollowUser };
