const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getKarats,
  getKaratsByType,
  addKarat,
  updateKarat,
  deleteKarat
} = require('../controllers/karatController');

router.get('/', authenticateToken, getKarats);
router.get('/type/:type', authenticateToken, getKaratsByType);
router.post('/', authenticateToken, addKarat);
router.put('/:id', authenticateToken, updateKarat);
router.delete('/:id', authenticateToken, deleteKarat);

module.exports = router;