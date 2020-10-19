var mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique:true,
    trim: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  }
});

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;
