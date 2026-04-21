const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { createNotification } = require('./notificationController');

const addComment = async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = new Comment({
      post: postId,
      author: req.user._id,
      content,
      parentComment: parentCommentId || null
    });
    await comment.save();
    
    // Notify post author
    if (post.author.toString() !== req.user._id.toString()) {
      const io = req.app.get('io');
      createNotification(io, {
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        comment: comment._id
      });
    }

    const populatedComment = await comment.populate('author', 'username avatar');
    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    // Build threaded structure
    const commentMap = {};
    const threadedComments = [];

    comments.forEach(comment => {
      commentMap[comment._id] = { ...comment.toObject(), replies: [] };
    });

    comments.forEach(comment => {
      if (comment.parentComment) {
        if (commentMap[comment.parentComment]) {
          commentMap[comment.parentComment].replies.push(commentMap[comment._id]);
        }
      } else {
        threadedComments.push(commentMap[comment._id]);
      }
    });

    res.json(threadedComments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addComment, getCommentsByPost };
