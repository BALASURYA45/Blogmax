const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const extractMentionUsernames = (text) => {
  const matches = text.match(/@([a-zA-Z0-9_]{3,30})/g) || [];
  const usernames = matches.map(m => m.slice(1));
  return Array.from(new Set(usernames));
};

const addComment = async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const mentionUsernames = extractMentionUsernames(content || '');
    const mentionedUsers = mentionUsernames.length
      ? await User.find({ username: { $in: mentionUsernames } }).select('_id username').lean()
      : [];
    const mentionIds = mentionedUsers.map(u => u._id);

    const comment = new Comment({
      post: postId,
      author: req.user._id,
      content,
      parentComment: parentCommentId || null
      ,
      mentions: mentionIds
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

    // Notify mentioned users
    if (mentionIds.length > 0) {
      const io = req.app.get('io');
      mentionIds.forEach((mentionedId) => {
        if (mentionedId.toString() === req.user._id.toString()) return;
        createNotification(io, {
          recipient: mentionedId,
          sender: req.user._id,
          type: 'mention',
          post: post._id,
          comment: comment._id
        });
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

const reactToComment = async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji || typeof emoji !== 'string' || emoji.length > 10) {
      return res.status(400).json({ message: 'Invalid emoji' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userIdStr = req.user._id.toString();
    comment.reactions = comment.reactions || [];

    const existing = comment.reactions.find(r => r.emoji === emoji);
    let added = false;

    if (!existing) {
      comment.reactions.push({ emoji, users: [req.user._id] });
      added = true;
    } else {
      const idx = (existing.users || []).findIndex(u => u.toString() === userIdStr);
      if (idx === -1) {
        existing.users.push(req.user._id);
        added = true;
      } else {
        existing.users.splice(idx, 1);
        added = false;
      }

      if (existing.users.length === 0) {
        comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
      }
    }

    await comment.save();

    // Notify comment author when someone reacts (only on add)
    if (added && comment.author.toString() !== userIdStr) {
      const io = req.app.get('io');
      createNotification(io, {
        recipient: comment.author,
        sender: req.user._id,
        type: 'reaction',
        post: comment.post,
        comment: comment._id
      });
    }

    res.json({ commentId: comment._id, reactions: comment.reactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addComment, getCommentsByPost, reactToComment };
