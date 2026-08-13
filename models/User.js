const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
{
  username:
  {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email:
  {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password:
  {
    type: String,
    required: true,
    minlength: 6
  },
  avatarUrl:
  {
    type: String,
    default: ''
  },
  favoriteGenres:
  {
    type: [String],
    default: []
  },
  groups:
  {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Group',
    default: []
  }
},
{
  timestamps: true
});

userSchema.pre('save', async function hashPassword()
{
  if (!this.isModified('password'))
  {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword)
{
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject()
{
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    avatarUrl: this.avatarUrl,
    favoriteGenres: this.favoriteGenres
  };
};

module.exports = mongoose.model('User', userSchema);
