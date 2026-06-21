const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const {
  getAllSales,
  getSaleById,
  addSale,
  updateSale,
  deleteSale
} = require('../controllers/salesController');

router.get('/', authenticateToken, getAllSales);
router.get('/:id', authenticateToken, getSaleById);
router.post('/', authenticateToken, isAdmin, addSale);
router.put('/:id', authenticateToken, isAdmin, updateSale);
router.delete('/:id', authenticateToken, isAdmin, deleteSale);

module.exports = router;
