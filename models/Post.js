const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
{
  author:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text:
  {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  createdAt:
  {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema(
{
  author:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title:
  {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  content:
  {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000
  },
  mediaUrl:
  {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  location:
  {
    type:
    {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates:
    {
      type: [Number],
      default: [0, 0]
    }
  },
  genre:
  {
    type: String,
    default: '',
    trim: true,
    maxlength: 40
  },
  group:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  isLive:
  {
    type: Boolean,
    default: false
  },
  likedBy:
  {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  comments:
  {
    type: [commentSchema],
    default: []
  }
},
{
  timestamps: true
});

postSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Post', postSchema);
