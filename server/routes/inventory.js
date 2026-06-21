const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory
} = require('../controllers/inventoryController');

router.get('/', authenticateToken, getInventory);
router.post('/', authenticateToken, addInventory);
router.put('/:id', authenticateToken, updateInventory);
router.delete('/:id', authenticateToken, deleteInventory);

module.exports = router;