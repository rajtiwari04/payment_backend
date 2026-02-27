const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paymentToken: { type: String, required: true, unique: true },
  maskedCardNumber: String,
  cardHolderName: String,
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet'],
    required: true
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: {
    type: String,
    enum: ['initiated', 'otp_pending', 'processing', 'approved', 'declined', 'failed', 'refunded'],
    default: 'initiated'
  },
  gatewayResponse: {
    gatewayTransactionId: String,
    authCode: String,
    responseCode: String,
    responseMessage: String,
    processedAt: Date
  },
  bankResponse: {
    bankTransactionId: String,
    approved: Boolean,
    reason: String,
    processedAt: Date
  },
  riskAssessment: {
    riskScore: { type: Number, default: 0 },
    flags: [String],
    assessed: { type: Boolean, default: false }
  },
  deviceInfo: {
    deviceId: String,
    userAgent: String,
    ip: String,
    isNewDevice: Boolean
  },
  otpVerified: { type: Boolean, default: false },
  biometricVerified: { type: Boolean, default: false },
  refundedAt: Date,
  refundReason: String
}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ paymentToken: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
