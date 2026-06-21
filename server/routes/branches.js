const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getBranches,
  addBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/branchController');

router.get('/', authenticateToken, getBranches);
router.post('/', authenticateToken, addBranch);
router.put('/:id', authenticateToken, updateBranch);
router.delete('/:id', authenticateToken, deleteBranch);

module.exports = router;