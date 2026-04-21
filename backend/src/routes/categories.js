const express = require('express');
const router = express.Router();
const { createCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', getCategories);
router.post('/', auth, authorize('admin'), createCategory);
router.put('/:id', auth, authorize('admin'), updateCategory);
router.delete('/:id', auth, authorize('admin'), deleteCategory);

module.exports = router;
