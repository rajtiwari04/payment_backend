const express = require('express');
const router = express.Router();
const { initiatePayment, verifyOTPAndProcess, getTransactionStatus } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/initiate', protect, initiatePayment);
router.post('/verify-otp', protect, verifyOTPAndProcess);
router.get('/transaction/:id', protect, getTransactionStatus);

module.exports = router;
