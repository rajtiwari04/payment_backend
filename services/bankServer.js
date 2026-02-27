const crypto = require('crypto');

const generateBankTransactionId = () => {
  return 'BNK_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

const BANK_APPROVAL_RULES = {
  MAX_SINGLE_TRANSACTION: 10000,
  DAILY_LIMIT: 25000
};

const processBankApproval = async (gatewayResponse, transactionData) => {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  if (!gatewayResponse.success) {
    return {
      approved: false,
      bankTransactionId: generateBankTransactionId(),
      reason: 'Gateway declined transaction',
      processedAt: new Date()
    };
  }

  const { amount } = transactionData;

  if (amount > BANK_APPROVAL_RULES.MAX_SINGLE_TRANSACTION) {
    return {
      approved: false,
      bankTransactionId: generateBankTransactionId(),
      reason: 'Amount exceeds single transaction limit',
      processedAt: new Date()
    };
  }

  return {
    approved: true,
    bankTransactionId: generateBankTransactionId(),
    reason: 'Transaction approved by bank',
    settlementDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    processedAt: new Date()
  };
};

module.exports = { processBankApproval };
