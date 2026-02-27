const express = require('express');
const router = express.Router();
const { getDashboardStats, getFraudLogs, reviewFraudLog } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/fraud-logs', getFraudLogs);
router.put('/fraud-logs/:id/review', reviewFraudLog);

module.exports = router;
