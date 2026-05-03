const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'doctor', 'admin'],
      default: 'user',
    },
    isActive:   { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // OTP fields (hidden from default queries)
    otp:          { type: String, default: null, select: false },
    otpExpiresAt: { type: Date,   default: null, select: false },
    otpAttempts:  { type: Number, default: 0,    select: false },

    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare plain-text password with hash
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Set a new OTP with 10-min expiry
userSchema.methods.setOTP = function (otp) {
  this.otp          = otp;
  this.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  this.otpAttempts  = 0;
};

// Verify submitted OTP - returns 'ok' | 'wrong' | 'expired' | 'invalid' | 'too_many'
userSchema.methods.verifyOTP = function (inputOtp) {
  if (this.otpAttempts >= 5)                     return 'too_many';
  if (!this.otp || !this.otpExpiresAt)           return 'invalid';
  if (Date.now() > this.otpExpiresAt.getTime())  return 'expired';
  this.otpAttempts += 1;
  if (this.otp !== inputOtp)                     return 'wrong';
  return 'ok';
};

// Clear OTP fields after successful verification or resend
userSchema.methods.clearOTP = function () {
  this.otp          = null;
  this.otpExpiresAt = null;
  this.otpAttempts  = 0;
};

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiresAt;
  delete obj.otpAttempts;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);