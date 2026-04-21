const express = require('express');
const router = express.Router();
const { 
  createPost, getPosts, getPostBySlug, updatePost, deletePost, toggleLike, incrementViews, getRelatedPosts, getAuthorStats
} = require('../controllers/postController');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getPosts);
router.get('/stats', auth, getAuthorStats);
router.get('/related', getRelatedPosts);
router.get('/:slug', optionalAuth, getPostBySlug);
router.post('/:id/view', incrementViews);
router.post('/', auth, createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, toggleLike);

module.exports = router;
