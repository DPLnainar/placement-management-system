const mongoose = require('mongoose');

/**
 * Job Model
 * 
 * Represents a job posting in the system.
 * Each job belongs to a college and can only be accessed by users from that college.
 * Only admins and moderators can create/edit jobs.
 * Students can view and apply for jobs from their college.
 */
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  salary: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'contract'],
    default: 'full-time'
  },
  deadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  // Reference to the college this job belongs to
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College assignment is required']
  },
  // Track who posted this job
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'closed'],
    default: 'active'
  },
  // Job requirements (percentages, cgpa, skills)
  requirements: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if job deadline has passed
jobSchema.methods.isExpired = function() {
  return new Date() > this.deadline;
};

module.exports = mongoose.model('Job', jobSchema);
