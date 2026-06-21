const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getDashboardData } = require('../controllers/dashboardController');

router.get('/', authenticateToken, getDashboardData);

module.exports = router;
