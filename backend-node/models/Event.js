const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  eventType: {
    type: String,
    enum: [
      'pre_placement_talk',
      'aptitude_test',
      'technical_interview',
      'hr_interview',
      'group_discussion',
      'coding_test',
      'workshop',
      'seminar',
      'deadline',
      'orientation',
      'result_announcement',
      'document_verification',
      'other'
    ],
    required: true,
    index: true
  },
  
  // Date and time
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true
  },
  
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  isAllDay: {
    type: Boolean,
    default: false
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['physical', 'online', 'hybrid'],
      default: 'physical'
    },
    venue: String,
    room: String,
    building: String,
    onlineLink: String,
    platform: String // Zoom, Meet, Teams, etc.
  },
  
  // Related entities
  relatedJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  
  relatedDrive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementDrive'
  },
  
  company: {
    name: String,
    logo: String
  },
  
  // Participants
  organizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  targetAudience: {
    type: String,
    enum: ['all_students', 'eligible_students', 'applied_students', 'shortlisted_students', 'specific_students', 'staff_only'],
    default: 'all_students'
  },
  
  specificStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  eligibilityCriteria: {
    branches: [String],
    years: [Number],
    minCGPA: Number,
    maxBacklogs: Number
  },
  
  // Capacity and registration
  capacity: {
    type: Number,
    min: 0
  },
  
  registrationRequired: {
    type: Boolean,
    default: false
  },
  
  registrationDeadline: Date,
  
  registeredStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'attended', 'absent', 'cancelled'],
      default: 'registered'
    }
  }],
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification', 'sms'],
      default: 'notification'
    },
    minutesBefore: {
      type: Number,
      default: 60 // 1 hour before
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  
  // Attachments and resources
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status and visibility
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
    index: true
  },
  
  isPublished: {
    type: Boolean,
    default: false
  },
  
  color: {
    type: String,
    default: '#3B82F6' // Blue
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Notes and updates
  notes: String,
  
  updates: [{
    message: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ college: 1, startDate: 1 });
eventSchema.index({ college: 1, eventType: 1, status: 1 });
eventSchema.index({ college: 1, isPublished: 1, startDate: 1 });
eventSchema.index({ relatedJob: 1 });
eventSchema.index({ relatedDrive: 1 });

// Virtual for duration
eventSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    return Math.round((this.endDate - this.startDate) / (1000 * 60)); // Duration in minutes
  }
  return 0;
});

// Virtual for is past event
eventSchema.virtual('isPast').get(function() {
  return this.endDate < new Date();
});

// Virtual for is upcoming (within next 7 days)
eventSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return this.startDate > now && this.startDate <= sevenDaysFromNow;
});

// Virtual for attendance rate
eventSchema.virtual('attendanceRate').get(function() {
  if (this.registeredStudents.length === 0) return 0;
  const attended = this.registeredStudents.filter(r => r.status === 'attended').length;
  return Math.round((attended / this.registeredStudents.length) * 100);
});

// Methods
eventSchema.methods.isStudentEligible = function(student) {
  if (this.targetAudience === 'all_students') return true;
  if (this.targetAudience === 'staff_only') return false;
  
  if (this.targetAudience === 'specific_students') {
    return this.specificStudents.some(s => s.toString() === student._id.toString());
  }
  
  // Check eligibility criteria
  if (this.eligibilityCriteria) {
    const criteria = this.eligibilityCriteria;
    
    if (criteria.branches && criteria.branches.length > 0) {
      if (!criteria.branches.includes(student.branch)) return false;
    }
    
    if (criteria.years && criteria.years.length > 0) {
      if (!criteria.years.includes(student.year)) return false;
    }
    
    if (criteria.minCGPA && student.cgpa < criteria.minCGPA) return false;
    if (criteria.maxBacklogs !== undefined && student.currentBacklogs > criteria.maxBacklogs) return false;
  }
  
  return true;
};

eventSchema.methods.isStudentRegistered = function(studentId) {
  return this.registeredStudents.some(r => r.student.toString() === studentId.toString());
};

eventSchema.methods.getRegistrationStatus = function(studentId) {
  const registration = this.registeredStudents.find(r => r.student.toString() === studentId.toString());
  return registration ? registration.status : null;
};

eventSchema.methods.canRegister = function() {
  if (!this.registrationRequired) return false;
  if (this.status !== 'scheduled') return false;
  if (this.registrationDeadline && new Date() > this.registrationDeadline) return false;
  if (this.capacity && this.registeredStudents.length >= this.capacity) return false;
  return true;
};

// Validation
eventSchema.pre('save', function(next) {
  // Validate dates
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Validate registration deadline
  if (this.registrationDeadline && this.registrationDeadline >= this.startDate) {
    return next(new Error('Registration deadline must be before event start date'));
  }
  
  // Validate capacity
  if (this.capacity && this.registeredStudents.length > this.capacity) {
    return next(new Error('Registered students exceed capacity'));
  }
  
  next();
});

// Auto-update status
eventSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === 'scheduled') {
    if (now >= this.startDate && now <= this.endDate) {
      this.status = 'ongoing';
    } else if (now > this.endDate) {
      this.status = 'completed';
    }
  }
  
  next();
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
