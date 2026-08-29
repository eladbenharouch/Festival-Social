const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
{
  name:
  {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 60
  },
  description:
  {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  category:
  {
    type: String,
    required: true,
    trim: true
  },
  creator:
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members:
  {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  memberCount: { type: Number, default: 1 }
},
{
  timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);
