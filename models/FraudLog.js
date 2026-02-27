const mongoose = require('mongoose');

const fraudLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  riskScore: { type: Number, required: true },
  threshold: { type: Number, required: true },
  flags: [String],
  deviceInfo: {
    deviceId: String,
    userAgent: String,
    ip: String,
    isNewDevice: Boolean
  },
  transactionDetails: {
    amount: Number,
    paymentMethod: String,
    maskedCard: String
  },
  action: {
    type: String,
    enum: ['blocked', 'flagged', 'allowed_with_review'],
    default: 'blocked'
  },
  reviewed: { type: Boolean, default: false },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: String,
  reviewedAt: Date
}, { timestamps: true });

fraudLogSchema.index({ user: 1, createdAt: -1 });
fraudLogSchema.index({ riskScore: -1 });
fraudLogSchema.index({ reviewed: 1 });

module.exports = mongoose.model('FraudLog', fraudLogSchema);
