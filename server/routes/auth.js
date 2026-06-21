const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { signup, login } = require('../controllers/authController');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/signup', upload.single('photo'), signup);
router.post('/login', login);

module.exports = router;