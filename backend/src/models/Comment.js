const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    emoji: { type: String, required: true },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', CommentSchema);
