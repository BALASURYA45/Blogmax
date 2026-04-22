const express = require('express');
const router = express.Router();
const { 
  createPost,
  getPosts,
  getPostBySlug,
  updatePost,
  deletePost,
  toggleLike,
  incrementViews,
  getRelatedPosts,
  getAuthorStats,
  autosavePost,
  listRevisions,
  getRevision,
  restoreRevision,
  getTrendingPosts,
  getForYouPosts,
  getSimilarPosts
} = require('../controllers/postController');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getPosts);
router.get('/trending', optionalAuth, getTrendingPosts);
router.get('/for-you', optionalAuth, getForYouPosts);
router.get('/stats', auth, getAuthorStats);
router.get('/related', getRelatedPosts);
router.get('/:slug/similar', optionalAuth, getSimilarPosts);
router.get('/:slug', optionalAuth, getPostBySlug);
router.post('/:id/view', incrementViews);
router.post('/', auth, createPost);
router.put('/:id', auth, updatePost);
router.post('/:id/autosave', auth, autosavePost);
router.get('/:id/revisions', auth, listRevisions);
router.get('/:id/revisions/:revId', auth, getRevision);
router.post('/:id/revisions/:revId/restore', auth, restoreRevision);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, toggleLike);

module.exports = router;
