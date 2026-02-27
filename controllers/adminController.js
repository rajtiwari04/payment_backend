const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const FraudLog = require('../models/FraudLog');

const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalTransactions, fraudLogs, recentOrders] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Transaction.countDocuments(),
      FraudLog.countDocuments({ reviewed: false }),
      Order.find().sort('-createdAt').limit(10).populate('user', 'name email').lean()
    ]);

    const revenue = await Transaction.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const fraudByFlag = await FraudLog.aggregate([
      { $unwind: '$flags' },
      { $group: { _id: '$flags', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalTransactions,
        pendingFraudReviews: fraudLogs,
        totalRevenue: revenue[0]?.total || 0,
        approvedTransactions: revenue[0]?.count || 0,
        recentOrders,
        fraudByFlag
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFraudLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, reviewed } = req.query;
    const query = {};
    if (reviewed !== undefined) query.reviewed = reviewed === 'true';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      FraudLog.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit))
        .populate('user', 'name email').populate('transaction', 'amount paymentToken').lean(),
      FraudLog.countDocuments(query)
    ]);
    res.json({ success: true, logs, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const reviewFraudLog = async (req, res) => {
  try {
    const { notes } = req.body;
    const log = await FraudLog.findByIdAndUpdate(
      req.params.id,
      { reviewed: true, reviewedBy: req.user._id, reviewNotes: notes, reviewedAt: new Date() },
      { new: true }
    );
    if (!log) return res.status(404).json({ success: false, message: 'Fraud log not found' });
    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getFraudLogs, reviewFraudLog };
