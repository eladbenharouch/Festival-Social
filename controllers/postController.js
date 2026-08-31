const mongoose = require('mongoose');
const Post = require('../models/Post');
const Group = require('../models/Group');
const User = require('../models/User');

function isGroupMember(group, userId)
{
  return group.members.some((memberId) => memberId.toString() === userId);
}

function populatePost(query)
{
  return query
    .populate('author', 'username avatarUrl')
    .populate('group', 'name')
    .populate('comments.author', 'username avatarUrl');
}

function parseLocation(body)
{
  if (body.lat === undefined && body.lng === undefined)
  {
    return { location: undefined, error: null };
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
  {
    return { location: undefined, error: 'Invalid location coordinates' };
  }

  return { location: { type: 'Point', coordinates: [lng, lat] }, error: null };
}

async function createPost(req, res)
{
  try
  {
    const { title, content, mediaUrl, genre, group, isLive } = req.body;

    if (!title || !content)
    {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (group)
    {
      if (!mongoose.Types.ObjectId.isValid(group))
      {
        return res.status(400).json({ error: 'Invalid group id' });
      }

      const groupDoc = await Group.findById(group);

      if (!groupDoc)
      {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!isGroupMember(groupDoc, req.session.userId))
      {
        return res.status(403).json({ error: 'You must be a member of this group to post here' });
      }
    }

    const { location, error: locationError } = parseLocation(req.body);

    if (locationError)
    {
      return res.status(400).json({ error: locationError });
    }

    const post = await Post.create(
    {
      author: req.session.userId,
      title,
      content,
      mediaUrl: mediaUrl || '',
      genre: genre || '',
      group: group || null,
      isLive: Boolean(isLive),
      ...(location ? { location } : {})
    });

    return res.status(201).json({ post });
  }
  catch (err)
  {
    console.error('Create post error:', err.message);
    return res.status(500).json({ error: 'Server error while creating post' });
  }
}

async function getFeed(req, res)
{
  try
  {
    const currentUser = await User.findById(req.session.userId).select('groups following');

    const posts = await populatePost(Post.find(
    {
      $or:
      [
        { author: req.session.userId },
        { group: { $in: currentUser.groups } },
        { author: { $in: currentUser.following } }
      ]
    })).sort({ createdAt: -1 });

    return res.status(200).json({ posts });
  }
  catch (err)
  {
    console.error('Get feed error:', err.message);
    return res.status(500).json({ error: 'Server error while loading feed' });
  }
}

async function getPostsByGroup(req, res)
{
  try
  {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId))
    {
      return res.status(400).json({ error: 'Invalid group id' });
    }

    const group = await Group.findById(groupId);

    if (!group)
    {
      return res.status(404).json({ error: 'Group not found' });
    }

    const posts = await populatePost(Post.find({ group: groupId })).sort({ createdAt: -1 });

    return res.status(200).json({ posts });
  }
  catch (err)
  {
    console.error('Get posts by group error:', err.message);
    return res.status(500).json({ error: 'Server error while fetching group posts' });
  }
}

async function getPostsByUser(req, res)
{
  try
  {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId))
    {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await User.findById(userId);

    if (!user)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await populatePost(Post.find({ author: userId })).sort({ createdAt: -1 });

    return res.status(200).json({ posts });
  }
  catch (err)
  {
    console.error('Get posts by user error:', err.message);
    return res.status(500).json({ error: 'Server error while fetching user posts' });
  }
}

async function getPostById(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const post = await populatePost(Post.findById(id));

    if (!post)
    {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.status(200).json({ post });
  }
  catch (err)
  {
    console.error('Get post error:', err.message);
    return res.status(500).json({ error: 'Server error while fetching post' });
  }
}

async function updatePost(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const post = await Post.findById(id);

    if (!post)
    {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.session.userId)
    {
      return res.status(403).json({ error: 'Only the post author can update this post' });
    }

    const { title, content, mediaUrl, genre, isLive } = req.body;

    if (title)
    {
      post.title = title;
    }

    if (content)
    {
      post.content = content;
    }

    if (mediaUrl !== undefined)
    {
      post.mediaUrl = mediaUrl;
    }

    if (genre !== undefined)
    {
      post.genre = genre;
    }

    if (isLive !== undefined)
    {
      post.isLive = Boolean(isLive);
    }

    const { location, error: locationError } = parseLocation(req.body);

    if (locationError)
    {
      return res.status(400).json({ error: locationError });
    }

    if (location)
    {
      post.location = location;
    }

    await post.save();

    const populated = await populatePost(Post.findById(post._id));

    return res.status(200).json({ post: populated });
  }
  catch (err)
  {
    console.error('Update post error:', err.message);
    return res.status(500).json({ error: 'Server error while updating post' });
  }
}

async function deletePost(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const post = await Post.findById(id);

    if (!post)
    {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.session.userId)
    {
      return res.status(403).json({ error: 'Only the post author can delete this post' });
    }

    await post.deleteOne();

    return res.status(200).json({ message: 'Post deleted successfully' });
  }
  catch (err)
  {
    console.error('Delete post error:', err.message);
    return res.status(500).json({ error: 'Server error while deleting post' });
  }
}

async function toggleLike(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const post = await Post.findById(id);

    if (!post)
    {
      return res.status(404).json({ error: 'Post not found' });
    }

    const alreadyLiked = post.likedBy.some((userId) => userId.toString() === req.session.userId);

    if (alreadyLiked)
    {
      post.likedBy = post.likedBy.filter((userId) => userId.toString() !== req.session.userId);
    }
    else
    {
      post.likedBy.push(req.session.userId);
    }

    await post.save();

    const populated = await populatePost(Post.findById(post._id));

    return res.status(200).json({ post: populated });
  }
  catch (err)
  {
    console.error('Toggle like error:', err.message);
    return res.status(500).json({ error: 'Server error while toggling like' });
  }
}

async function addComment(req, res)
{
  try
  {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const post = await Post.findById(id);

    if (!post)
    {
      return res.status(404).json({ error: 'Post not found' });
    }

    const { text } = req.body;

    if (!text || !text.trim())
    {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    post.comments.push({ author: req.session.userId, text: text.trim(), createdAt: new Date() });
    await post.save();

    const populated = await populatePost(Post.findById(post._id));

    return res.status(201).json({ post: populated });
  }
  catch (err)
  {
    console.error('Add comment error:', err.message);
    return res.status(500).json({ error: 'Server error while adding comment' });
  }
}

async function deleteComment(req, res)
{
  try
  {
    const { id, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
    {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId))
    {
      return res.status(400).json({ error: 'Invalid comment id' });
    }

    const post = await Post.findById(id);

    if (!post)
    {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(commentId);

    if (!comment)
    {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const isCommentAuthor = comment.author.toString() === req.session.userId;
    const isPostAuthor = post.author.toString() === req.session.userId;

    if (!isCommentAuthor && !isPostAuthor)
    {
      return res.status(403).json({ error: 'You are not allowed to delete this comment' });
    }

    post.comments.pull({ _id: commentId });
    await post.save();

    return res.status(200).json({ message: 'Comment deleted successfully' });
  }
  catch (err)
  {
    console.error('Delete comment error:', err.message);
    return res.status(500).json({ error: 'Server error while deleting comment' });
  } 
}

async function searchPosts(req, res)
{
  try
  {
    const { genre, isLive, lat, lng, maxDistance } = req.query;

    const filter = {};

    if (genre)
    {
      filter.genre = genre;
    }

    if (isLive === 'true')
    {
      filter.isLive = true;
    }
    else if (isLive === 'false')
    {
      filter.isLive = false;
    }

    if (lat !== undefined && lng !== undefined)
    {
      const latNum = Number(lat);
      const lngNum = Number(lng);

      if (Number.isNaN(latNum) || Number.isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180)
      {
        return res.status(400).json({ error: 'Invalid location coordinates' });
      }

      filter.location =
      {
        $near:
        {
          $geometry: { type: 'Point', coordinates: [lngNum, latNum] },
          $maxDistance: maxDistance ? Number(maxDistance) : 10000
        }
      };
    }

    const posts = await populatePost(Post.find(filter)).sort({ createdAt: -1 });

    return res.status(200).json({ posts });
  }
  catch (err)
  {
    console.error('Search posts error:', err.message);
    return res.status(500).json({ error: 'Server error while searching posts' });
  }
}

module.exports =
{
  createPost,
  getFeed,
  getPostsByGroup,
  getPostsByUser,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  searchPosts
};
