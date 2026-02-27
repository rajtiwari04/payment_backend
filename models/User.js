const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: 'US' }
  },
  deviceFingerprints: [{
    deviceId: String,
    userAgent: String,
    ip: String,
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now }
  }],
  knownLocations: [{
    ip: String,
    city: String,
    country: String,
    firstSeen: { type: Date, default: Date.now }
  }],
  otp: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  twoFactorEnabled: { type: Boolean, default: true },
  biometricEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isNewDevice = function (deviceId) {
  return !this.deviceFingerprints.some(d => d.deviceId === deviceId);
};

userSchema.methods.isUnusualLocation = function (ip) {
  if (this.knownLocations.length === 0) return false;
  return !this.knownLocations.some(loc => loc.ip === ip);
};

module.exports = mongoose.model('User', userSchema);
