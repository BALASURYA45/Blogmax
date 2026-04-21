const express = require('express');
const router = express.Router();
const { getProfile, toggleFollow, updateProfile, getAuthors, toggleBookmark, getBookmarks } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/authors', getAuthors);
router.get('/bookmarks', auth, getBookmarks);
router.post('/bookmark/:postId', auth, toggleBookmark);
router.get('/profile/:id', getProfile);
router.post('/follow/:id', auth, toggleFollow);
router.put('/profile', auth, updateProfile);

module.exports = router;
