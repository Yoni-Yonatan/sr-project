const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', authenticateToken, getCategories);
router.post('/', authenticateToken, upload.single('image'), addCategory);
router.put('/:id', authenticateToken, upload.single('image'), updateCategory);
router.delete('/:id', authenticateToken, deleteCategory);

module.exports = router;