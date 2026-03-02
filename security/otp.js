const crypto = require('crypto');

const generateOTP = () => {
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 900000 + 100000;
  return String(num);
};

const hashOTP = (rawOtp) => {
  return crypto.createHash('sha256').update(rawOtp).digest('hex');
};

const getOTPExpiry = (minutes = null) => {
  const expireMinutes =
    minutes || parseInt(process.env.OTP_EXPIRE_MINUTES) || 5;
  return new Date(Date.now() + expireMinutes * 60 * 1000);
};

const isOTPExpired = (expiresAt) => {
  return !expiresAt || new Date() > new Date(expiresAt);
};

const verifyOTP = (submittedOtp, storedHash, expiresAt) => {
  if (!storedHash || !expiresAt)
    return { valid: false, reason: 'OTP not found' };

  if (isOTPExpired(expiresAt))
    return { valid: false, reason: 'OTP has expired' };

  const submittedHash = hashOTP(submittedOtp);

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(submittedHash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );

  if (!isMatch)
    return { valid: false, reason: 'Invalid OTP' };

  return { valid: true };
};

module.exports = {
  generateOTP,
  hashOTP,
  getOTPExpiry,
  isOTPExpired,
  verifyOTP
};