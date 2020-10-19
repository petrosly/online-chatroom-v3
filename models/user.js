var mongoose = require('mongoose');


var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false  
  }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
