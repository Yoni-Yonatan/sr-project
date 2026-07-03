const express = require('express');
const router = express.Router();
const { checkDatabase } = require('../controllers/dbCheckController');

// Route is public or protected? We will leave it public for easy checking or add auth middleware if needed.
// Given it's a health check/db status, keeping it public is standard for `/api/health` kind of endpoints.
router.get('/', checkDatabase);

module.exports = router;
