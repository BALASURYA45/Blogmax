const express = require('express');
const router = express.Router();
const { addComment, getCommentsByPost } = require('../controllers/commentController');
const { auth } = require('../middleware/auth');

router.get('/:postId', getCommentsByPost);
router.post('/', auth, addComment);

module.exports = router;
