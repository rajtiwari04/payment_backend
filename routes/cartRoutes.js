const express = require('express');
const router = express.Router();
const { getCart, validateCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCart);
router.post('/validate', protect, validateCart);

module.exports = router;
