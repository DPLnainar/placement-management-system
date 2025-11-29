const mongoose = require('mongoose');

/**
 * College Model
 * 
 * Represents a college in the system.
 * Each college has one admin who is manually assigned by developers in the database.
 * The admin then assigns moderators and students to their college.
 */
const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'College name is required'],
    unique: true,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'College location is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'College code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  // Reference to the admin user assigned to this college
  // This is set manually by developers when creating the college
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Subscription management for the college
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'trial', 'suspended'],
    default: 'active'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
collegeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('College', collegeSchema);
