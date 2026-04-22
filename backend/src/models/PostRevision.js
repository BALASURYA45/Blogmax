const mongoose = require('mongoose');

const PostRevisionSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: ['autosave', 'manual', 'restore'],
      default: 'autosave'
    },
    snapshotHash: {
      type: String,
      required: true,
      index: true
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: { type: [String], default: [] },
    featuredImage: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    }
  },
  { timestamps: true }
);

PostRevisionSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model('PostRevision', PostRevisionSchema);

