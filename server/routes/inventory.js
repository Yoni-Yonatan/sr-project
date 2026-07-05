const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const {
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory
} = require('../controllers/inventoryController');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', authenticateToken, getInventory);
router.post('/', authenticateToken, upload.single('image'), addInventory);
router.put('/:id', authenticateToken, upload.single('image'), updateInventory);
router.delete('/:id', authenticateToken, deleteInventory);

module.exports = router;