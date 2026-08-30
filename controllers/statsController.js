const Post = require('../models/Post');

async function getPostsByGenre(req, res)
{
  try
  {
    const stats = await Post.aggregate(
    [
      {
        $group:
        {
          _id: '$genre',
          postCount: { $sum: 1 }
        }
      },
      {
  $project:
  {
    _id: 0,
    genre: '$_id',
    postCount: 1
  }
},
      {
        $sort:
        {
          postCount: -1
        }
      }
    ]);

    return res.status(200).json({ stats });
  }
  catch (err)
  {
    console.error('Get posts by genre stats error:', err.message);
    return res.status(500).json({ error: 'Server error while loading genre statistics' });
  }
}
async function getPostsByGroup(req, res)
{
  try
  {
    const stats = await Post.aggregate(
[
  {
    $match:
    {
      group: { $ne: null }
    }
  },
  {
    $group:
    {
      _id: '$group',
      postCount: { $sum: 1 }
    }
  },
  {
    $lookup:
    {
      from: 'groups',
      localField: '_id',
      foreignField: '_id',
      as: 'groupInfo'
    }
  },
  {
    $unwind: '$groupInfo'
  },
  {
    $project:
    {
      _id: 0,
      groupName: '$groupInfo.name',
      postCount: 1
    }
  },
  {
    $sort:
    {
      postCount: -1
    }
  }
]);

    return res.status(200).json({ stats });
  }
  catch (err)
  {
    console.error('Get posts by group stats error:', err.message);
    return res.status(500).json({ error: 'Server error while loading group statistics' });
  }
}

module.exports =
{
  getPostsByGenre,
  getPostsByGroup
};