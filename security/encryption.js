const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

const getKey = () => {
  const key = process.env.ENCRYPTION_KEY || '';
  if (key.length < KEY_LENGTH) {
    return crypto.scryptSync(key, 'hybrid-payment-salt', KEY_LENGTH);
  }
  return Buffer.from(key.slice(0, KEY_LENGTH));
};

const encrypt = (plaintext) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
};

const decrypt = (ciphertext) => {
  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.slice(0, IV_LENGTH);
  const tag = data.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.slice(IV_LENGTH + TAG_LENGTH);
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};

const generateToken = () => {
  return 'TOK_' + crypto.randomBytes(16).toString('hex').toUpperCase();
};

const maskCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  return '**** **** **** ' + cleaned.slice(-4);
};

const hashData = (data) => {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
};

const generateSecureId = () => {
  return crypto.randomBytes(20).toString('hex');
};

module.exports = { encrypt, decrypt, generateToken, maskCardNumber, hashData, generateSecureId };
