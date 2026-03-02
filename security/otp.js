const crypto = require('crypto');

const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % digits.length];
  }

  return otp;
};

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const getOTPExpiry = (minutes = null) => {
  const expireMinutes =
    minutes || parseInt(process.env.OTP_EXPIRE_MINUTES) || 5;

  return new Date(Date.now() + expireMinutes * 60 * 1000);
};

const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

const isOTPValid = (inputOtp, storedHashedOtp, expiresAt) => {
  if (isOTPExpired(expiresAt)) {
    return { valid: false, reason: 'OTP has expired' };
  }

  const hashedInput = hashOTP(inputOtp);

  if (hashedInput !== storedHashedOtp) {
    return { valid: false, reason: 'Invalid OTP' };
  }

  return { valid: true };
};

module.exports = {
  generateOTP,
  hashOTP,
  getOTPExpiry,
  isOTPExpired,
  isOTPValid
};