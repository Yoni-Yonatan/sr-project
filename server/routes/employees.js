const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  toggleEmployeeStatus
} = require('../controllers/employeeController');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', authenticateToken, getAllEmployees);
router.get('/:id', authenticateToken, getEmployeeById);
router.post('/', authenticateToken, upload.single('photo'), addEmployee);
router.put('/:id', authenticateToken, upload.single('photo'), updateEmployee);
router.patch('/:id/toggle-status', authenticateToken, toggleEmployeeStatus);

module.exports = router;