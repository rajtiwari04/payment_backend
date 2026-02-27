const FraudLog = require('../models/FraudLog');

const HIGH_AMOUNT_THRESHOLD = 500;
const RISK_THRESHOLD = parseInt(process.env.FRAUD_RISK_THRESHOLD) || 2;

const RISK_WEIGHTS = {
  unusual_location: 1,
  high_amount: 0,
  new_device: 1,
  multiple_failed_attempts: 2,
  velocity_check: 1,
  suspicious_pattern: 1
};

const calculateRiskScore = (factors) => {
  let score = 0;
  const flags = [];

  if (factors.unusual_location) {
    score += RISK_WEIGHTS.unusual_location;
    flags.push('unusual_location');
  }
  if (factors.high_amount) {
    score += RISK_WEIGHTS.high_amount;
    flags.push('high_amount');
  }
  if (factors.new_device) {
    score += RISK_WEIGHTS.new_device;
    flags.push('new_device');
  }
  if (factors.multiple_failed_attempts) {
    score += RISK_WEIGHTS.multiple_failed_attempts;
    flags.push('multiple_failed_attempts');
  }
  if (factors.velocity_check) {
    score += RISK_WEIGHTS.velocity_check;
    flags.push('velocity_check');
  }
  if (factors.suspicious_pattern) {
    score += RISK_WEIGHTS.suspicious_pattern;
    flags.push('suspicious_pattern');
  }

  return { score, flags };
};

const assessRisk = async (user, transactionData) => {
  const factors = {
    unusual_location: user.isUnusualLocation(transactionData.ip),
    high_amount: transactionData.amount > HIGH_AMOUNT_THRESHOLD,
    new_device: user.isNewDevice(transactionData.deviceId),
    multiple_failed_attempts: transactionData.failedAttempts >= 3,
    velocity_check: transactionData.recentTransactionCount >= 5,
    suspicious_pattern: false
  };

  const { score, flags } = calculateRiskScore(factors);
  const blocked = score >= RISK_THRESHOLD;

  return {
    riskScore: score,
    flags,
    threshold: RISK_THRESHOLD,
    blocked,
    factors
  };
};

const logFraud = async (fraudData) => {
  const fraudLog = new FraudLog({
    user: fraudData.userId,
    transaction: fraudData.transactionId,
    order: fraudData.orderId,
    riskScore: fraudData.riskScore,
    threshold: RISK_THRESHOLD,
    flags: fraudData.flags,
    deviceInfo: fraudData.deviceInfo,
    transactionDetails: fraudData.transactionDetails,
    action: fraudData.riskScore >= RISK_THRESHOLD * 2 ? 'blocked' : 'flagged'
  });
  return await fraudLog.save();
};

module.exports = { assessRisk, logFraud, calculateRiskScore, RISK_THRESHOLD, HIGH_AMOUNT_THRESHOLD };
