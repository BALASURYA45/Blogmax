const express = require('express');
const router = express.Router();
const { addComment, getCommentsByPost, reactToComment } = require('../controllers/commentController');
const { auth } = require('../middleware/auth');

router.get('/:postId', getCommentsByPost);
router.post('/', auth, addComment);
router.post('/:id/react', auth, reactToComment);

module.exports = router;
