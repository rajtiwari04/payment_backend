const crypto = require('crypto');

const GATEWAY_SUCCESS_RATE = 0.95;

const generateGatewayTransactionId = () => {
  return 'GW_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

const generateAuthCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

const processPaymentGateway = async (paymentData) => {
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

  const { amount, paymentToken, paymentMethod } = paymentData;

  if (!paymentToken || !amount || amount <= 0) {
    return {
      success: false,
      responseCode: 'INVALID_REQUEST',
      responseMessage: 'Invalid payment request parameters',
      gatewayTransactionId: null
    };
  }

  const isSuccess = Math.random() < GATEWAY_SUCCESS_RATE;

  if (isSuccess) {
    return {
      success: true,
      responseCode: '00',
      responseMessage: 'Transaction Approved',
      gatewayTransactionId: generateGatewayTransactionId(),
      authCode: generateAuthCode(),
      processedAt: new Date()
    };
  }

  const errorCodes = [
    { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds' },
    { code: 'CARD_DECLINED', message: 'Card declined by issuer' },
    { code: 'NETWORK_ERROR', message: 'Network timeout' }
  ];
  const error = errorCodes[Math.floor(Math.random() * errorCodes.length)];

  return {
    success: false,
    responseCode: error.code,
    responseMessage: error.message,
    gatewayTransactionId: generateGatewayTransactionId(),
    processedAt: new Date()
  };
};

module.exports = { processPaymentGateway };
