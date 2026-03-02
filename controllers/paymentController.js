const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendOtpEmail } = require('../services/emailService');

const { encrypt, generateToken, maskCardNumber } = require('../security/encryption');
const { generateOTP, hashOTP, verifyOTP } = require('../security/otp');
const { assessRisk, logFraud } = require('../security/fraudDetection');
const { processPaymentGateway } = require('../services/paymentGateway');
const { processBankApproval } = require('../services/bankServer');

const initiatePayment = async (req, res) => {
  try {
    const { orderId, cardNumber, cardHolderName, expiryMonth, expiryYear, cvv, biometricVerified } = req.body;

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const deviceId = req.headers['x-device-id'] || 'default_device';

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      status: 'pending'
    });

    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found or already processed' });

    const user = await User.findById(req.user._id);

    const recentTransactions = await Transaction.countDocuments({
      user: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    const riskAssessment = await assessRisk(user, {
      ip,
      deviceId,
      amount: order.totalAmount,
      failedAttempts: 0,
      recentTransactionCount: recentTransactions
    });

    const paymentToken = generateToken();
    const maskedCard = maskCardNumber(cardNumber);

    const transaction = await Transaction.create({
      order: order._id,
      user: req.user._id,
      paymentToken,
      maskedCardNumber: maskedCard,
      cardHolderName,
      paymentMethod: order.paymentMethod,
      amount: order.totalAmount,
      status: 'initiated',
      deviceInfo: {
        deviceId,
        userAgent,
        ip,
        isNewDevice: user.isNewDevice(deviceId)
      },
      riskAssessment: {
        riskScore: riskAssessment.riskScore,
        flags: riskAssessment.flags,
        assessed: true
      },
      biometricVerified: biometricVerified || false
    });

    if (riskAssessment.blocked) {
      await logFraud({
        userId: req.user._id,
        transactionId: transaction._id,
        orderId: order._id,
        riskScore: riskAssessment.riskScore,
        flags: riskAssessment.flags
      });

      transaction.status = 'declined';
      await transaction.save();

      order.status = 'cancelled';
      await order.save();

      return res.status(403).json({
        success: false,
        message: 'Transaction blocked due to suspicious activity'
      });
    }

    const rawOtp = generateOTP();
    const hashedOtp = hashOTP(rawOtp);

    user.otp = hashedOtp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    transaction.status = 'otp_pending';
    await transaction.save();

    try {
      await sendOtpEmail(user.email, rawOtp, order._id);
      console.log("OTP email sent successfully to:", user.email);
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to registered email',
      transactionId: transaction._id,
      paymentToken,
      maskedCard,
      riskScore: riskAssessment.riskScore,
      otpRequired: true
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyOTPAndProcess = async (req, res) => {
  try {
    const { transactionId, otp, biometricVerified } = req.body;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: req.user._id,
      status: 'otp_pending'
    });

    if (!transaction)
      return res.status(404).json({ success: false, message: 'Transaction not found or already processed' });

    const user = await User.findById(req.user._id);

    if (!user.otp || !user.otpExpiry)
      return res.status(400).json({ success: false, message: 'No OTP found, please reinitiate payment' });

    const otpResult = verifyOTP(otp, user.otp, user.otpExpiry);

    if (!otpResult.valid)
      return res.status(400).json({ success: false, message: otpResult.reason });

    transaction.otpVerified = true;
    if (biometricVerified) transaction.biometricVerified = true;
    transaction.status = 'processing';
    await transaction.save();

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const order = await Order.findById(transaction.order);
    order.status = 'processing';
    order.otpVerified = true;
    await order.save();

    const gatewayResponse = await processPaymentGateway({
      amount: transaction.amount,
      paymentToken: transaction.paymentToken,
      paymentMethod: transaction.paymentMethod
    });

    const bankResponse = await processBankApproval(gatewayResponse, {
      amount: transaction.amount
    });

    if (bankResponse.approved) {
      transaction.status = 'approved';
      order.status = 'confirmed';
      order.transaction = transaction._id;

      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }
    } else {
      transaction.status = 'declined';
      order.status = 'cancelled';
    }

    await transaction.save();
    await order.save();

    res.json({
      success: bankResponse.approved,
      message: bankResponse.approved
        ? 'Payment successful!'
        : 'Payment declined by bank',
      transaction: {
        id: transaction._id,
        status: transaction.status,
        amount: transaction.amount,
        maskedCard: transaction.maskedCardNumber,
        paymentToken: transaction.paymentToken
      },
      order: {
        id: order._id,
        status: order.status
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactionStatus = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).lean();

    if (!transaction)
      return res.status(404).json({ success: false, message: 'Transaction not found' });

    res.json({ success: true, transaction });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  initiatePayment,
  verifyOTPAndProcess,
  getTransactionStatus
};