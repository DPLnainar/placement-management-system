const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model
 * 
 * Role Assignment Flow:
 * 1. Developers manually create an admin user and assign them to a college in the database
 * 2. Admin users can create and assign moderators and students to their college
 * 3. Moderators and students cannot create other users
 * 
 * College Association:
 * - All users must be associated with exactly one college (collegeId)
 * - Users can only access data related to their assigned college
 * - Admins can only assign users to their own college
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // Don't return password by default in queries
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'moderator', 'student'],
    required: [true, 'Role is required']
  },
  // Reference to the college this user belongs to
  // CRITICAL: This is set by developers for admins, and by admins for moderators/students
  // NULL for SuperAdmin (they can access all colleges)
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: function() {
      return this.role !== 'superadmin';  // Not required for SuperAdmin
    }
  },
  // Track who assigned this user (for audit purposes)
  // For admins: null (assigned by developers manually)
  // For moderators/students: the admin's userId who created them
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  // Password Reset Fields
  resetPasswordToken: {
    type: String,
    default: undefined
  },
  resetPasswordExpire: {
    type: Date,
    default: undefined
  },
  // Student Profile Fields
  primaryEmail: { type: String, trim: true, default: '' },
  secondaryEmail: { type: String, trim: true, default: '' },
  primaryPhone: { type: String, trim: true, default: '' },
  secondaryPhone: { type: String, trim: true, default: '' },
  dateOfBirth: { type: Date },
  gender: { type: String, trim: true, default: '' },
  nationality: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  
  // Passport Details
  passportNumber: { type: String, trim: true, default: '' },
  passportPlaceOfIssue: { type: String, trim: true, default: '' },
  passportIssueDate: { type: Date },
  passportExpiryDate: { type: Date },
  
  // 10th Standard Details
  tenthInstitution: { type: String, trim: true, default: '' },
  tenthPercentage: { type: Number, default: 0 },
  tenthBoard: { type: String, trim: true, default: '' },
  tenthYear: { type: Number },
  
  // 12th Standard Details
  twelfthInstitution: { type: String, trim: true, default: '' },
  twelfthPercentage: { type: Number, default: 0 },
  twelfthBoard: { type: String, trim: true, default: '' },
  twelfthYear: { type: Number },
  
  // Current Education Details
  currentInstitution: { type: String, trim: true, default: '' },
  degree: { type: String, trim: true, default: '' },
  branch: { type: String, trim: true, default: '' },
  semester: { type: Number, default: 0 },
  cgpa: { type: Number, default: 0 },
  backlogs: { type: Number, default: 0 },
  
  // Semester-wise GPA
  semesterWiseGPA: [{
    semester: { type: Number },
    sgpa: { type: Number, default: 0 },
    cgpa: { type: Number, default: 0 }
  }],
  
  // Arrear History
  arrearHistory: [{
    subject: { type: String, trim: true },
    code: { type: String, trim: true },
    semester: { type: Number },
    status: { type: String, enum: ['cleared', 'pending'], default: 'pending' }
  }],
  
  // Skills
  skills: [{
    name: { type: String, trim: true },
    category: { type: String, enum: ['technical', 'soft', 'tools', 'languages'], default: 'technical' }
  }],
  
  // Professional Links
  github: { type: String, trim: true, default: '' },
  linkedin: { type: String, trim: true, default: '' },
  portfolio: { type: String, trim: true, default: '' },
  
  // Internships
  internships: [{
    company: { type: String, trim: true },
    role: { type: String, trim: true },
    duration: { type: String, trim: true },
    description: { type: String, trim: true }
  }],
  
  // Extracurricular Activities
  extracurricular: [{
    activity: { type: String, trim: true },
    description: { type: String, trim: true }
  }],
  
  // Resume and Documents
  resumeLink: { type: String, trim: true, default: '' },
  resumeFile: { type: String, trim: true, default: '' }, // Cloudinary URL
  resumePublicId: { type: String, trim: true, default: '' }, // Cloudinary public ID for deletion
  resumeUploadedAt: { type: Date },
  
  // Profile Photo
  profilePhoto: { type: String, trim: true, default: '' }, // Cloudinary URL
  profilePhotoPublicId: { type: String, trim: true, default: '' },
  
  // Additional Documents
  documents: [{
    name: { type: String, trim: true },
    type: { type: String, enum: ['certificate', 'marksheet', 'id_proof', 'other'], default: 'other' },
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can assign other users (only admins can)
userSchema.methods.canAssignUsers = function() {
  return this.role === 'admin';
};

// Method to check if user belongs to a specific college
userSchema.methods.belongsToCollege = function(collegeId) {
  return this.collegeId.toString() === collegeId.toString();
};

module.exports = mongoose.model('User', userSchema);
