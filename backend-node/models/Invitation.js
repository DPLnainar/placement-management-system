const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Invitation Model
 * 
 * Used for student onboarding via invite links
 * Moderators/Admins create invitations with student email
 * Students use unique token to complete registration
 */
const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  rollNumber: {
    type: String,
    trim: true,
    sparse: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'registered', 'expired', 'cancelled'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  registeredAt: Date,
  registeredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  resendCount: {
    type: Number,
    default: 0
  },
  lastResentAt: Date
}, {
  timestamps: true
});

invitationSchema.index({ email: 1, college: 1 });
invitationSchema.index({ status: 1 });

invitationSchema.methods.generateToken = function() {
  this.token = crypto.randomBytes(32).toString('hex');
  return this.token;
};

invitationSchema.methods.isValid = function() {
  return this.status === 'pending' && this.expiresAt > new Date();
};

invitationSchema.methods.checkExpiration = function() {
  if (this.status === 'pending' && this.expiresAt <= new Date()) {
    this.status = 'expired';
    return this.save();
  }
  return Promise.resolve(this);
};

invitationSchema.virtual('registrationLink').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/register/${this.token}`;
});

invitationSchema.set('toJSON', { virtuals: true });
invitationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Invitation', invitationSchema);
