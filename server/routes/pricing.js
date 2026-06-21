const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getCurrentPrice, updatePrice } = require('../controllers/pricingController');

router.get('/', authenticateToken, getCurrentPrice);
router.post('/', authenticateToken, updatePrice);

module.exports = router;