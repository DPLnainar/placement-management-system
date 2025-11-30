const User = require('../models/User');
const StudentData = require('../models/StudentData');
const College = require('../models/College');

/**
 * Student Registration Controller
 * 
 * Students can self-register but MUST select and link to a specific college
 * This allows students to create their own accounts while maintaining data isolation
 */
exports.registerStudent = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      collegeId,  // REQUIRED: Student must select their college
      // Optional student data
      branch,
      yearOfStudy,
      rollNumber,
      phoneNumber
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !fullName || !collegeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, password, full name, and college'
      });
    }

    // Verify college exists and is active
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    if (college.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'This college is not currently accepting registrations'
      });
    }

    // Check if college subscription is active
    if (college.subscriptionStatus !== 'active' && college.subscriptionStatus !== 'trial') {
      return res.status(403).json({
        success: false,
        message: 'This college\'s subscription is not active. Please contact your college administration.'
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === username.toLowerCase()
          ? 'Username already taken'
          : 'Email already registered'
      });
    }

    // Create student user account
    const student = new User({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: password,  // Will be hashed by pre-save hook
      fullName: fullName.trim(),
      role: 'student',
      collegeId: collegeId,
      assignedBy: null,  // Self-registered
      status: 'active'
    });

    await student.save();

    // Create student data record
    const studentData = new StudentData({
      userId: student._id,
      collegeId: collegeId,
      branch: branch || null,
      yearOfStudy: yearOfStudy || null,
      rollNumber: rollNumber || null,
      phoneNumber: phoneNumber || null,
      documentsVerified: false,  // Requires moderator verification
      placementStatus: 'not_placed'
    });

    await studentData.save();

    // Return success (without password)
    const studentResponse = student.toObject();
    delete studentResponse.password;

    res.status(201).json({
      success: true,
      message: 'Student registration successful. You can now login.',
      data: {
        user: studentResponse,
        college: {
          _id: college._id,
          name: college.name,
          code: college.code
        }
      }
    });

  } catch (error) {
    console.error('Student registration error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error during registration. Please try again.'
    });
  }
};

/**
 * Get Student Profile with Student Data
 * 
 * Returns combined user info + student-specific data
 */
exports.getStudentProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get student user info
    const user = await User.findById(userId)
      .select('-password')
      .populate('collegeId', 'name code location');

    if (!user || user.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get student data
    const studentData = await StudentData.findOne({ userId: userId });

    res.status(200).json({
      success: true,
      data: {
        user: user,
        studentData: studentData
      }
    });

  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student profile'
    });
  }
};

/**
 * Update Student Profile
 * 
 * ROLE-BASED FIELD RESTRICTIONS:
 * 
 * Students can update (only if not already set):
 * - Skills (technical skills, frameworks, tools, databases, cloud)
 * - Extracurricular activities
 * - Internships
 * - Resume/documents
 * - Projects
 * - Certifications
 * 
 * Students CANNOT update (locked after first save):
 * - Personal information (fullName, phoneNumber, email)
 * - Academic details (CGPA, 10th/12th percentage, branch, year, roll number, semester records)
 * 
 * Moderators/Admins can update:
 * - All fields including locked ones
 */
exports.updateStudentProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const isModerator = req.user.role === 'admin' || req.user.role === 'moderator';
    const isOwnProfile = userId.toString() === req.user._id.toString();

    // Get existing student data to check what's already set
    const existingData = await StudentData.findOne({ userId: userId });
    
    if (!existingData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const {
      // Personal Information (locked for students after first save)
      fullName,
      phoneNumber,
      email,
      
      // Academic Details (locked for students after first save)
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      branch,
      yearOfStudy,
      rollNumber,
      semesterRecords,
      totalBacklogs,
      currentBacklogs,
      
      // Updatable by students (even after first save)
      skills,
      extracurricularActivities,
      internships,
      projects,
      certifications,
      achievements,
      resumeLink,
      placementPreferences
    } = req.body;

    // Check if student is trying to update locked fields
    if (!isModerator && isOwnProfile) {
      const lockedFieldsAttempted = [];
      
      // Check personal information
      if (fullName && existingData.userId) lockedFieldsAttempted.push('fullName');
      if (phoneNumber && existingData.userId) lockedFieldsAttempted.push('phoneNumber');
      if (email && existingData.userId) lockedFieldsAttempted.push('email');
      
      // Check academic details
      if (cgpa !== undefined && existingData.cgpa !== null && existingData.cgpa !== undefined) {
        lockedFieldsAttempted.push('CGPA');
      }
      if (tenthPercentage !== undefined && existingData.tenthPercentage !== null && existingData.tenthPercentage !== undefined) {
        lockedFieldsAttempted.push('10th percentage');
      }
      if (twelfthPercentage !== undefined && existingData.twelfthPercentage !== null && existingData.twelfthPercentage !== undefined) {
        lockedFieldsAttempted.push('12th percentage');
      }
      if (branch && existingData.userId) lockedFieldsAttempted.push('branch');
      if (yearOfStudy && existingData.userId) lockedFieldsAttempted.push('year of study');
      if (rollNumber && existingData.userId) lockedFieldsAttempted.push('roll number');
      if (semesterRecords && existingData.semesterRecords && existingData.semesterRecords.length > 0) {
        lockedFieldsAttempted.push('semester records');
      }
      
      if (lockedFieldsAttempted.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Students cannot modify ${lockedFieldsAttempted.join(', ')} once set. Only moderators can update these fields.`,
          lockedFields: lockedFieldsAttempted
        });
      }
    }

    // Build update object based on role
    const studentDataUpdate = {};
    
    if (isModerator) {
      // Moderators can update everything
      if (cgpa !== undefined) studentDataUpdate.cgpa = cgpa;
      if (tenthPercentage !== undefined) studentDataUpdate.tenthPercentage = tenthPercentage;
      if (twelfthPercentage !== undefined) studentDataUpdate.twelfthPercentage = twelfthPercentage;
      if (branch !== undefined) studentDataUpdate.branch = branch;
      if (yearOfStudy !== undefined) studentDataUpdate.yearOfStudy = yearOfStudy;
      if (rollNumber !== undefined) studentDataUpdate.rollNumber = rollNumber;
      if (semesterRecords !== undefined) studentDataUpdate.semesterRecords = semesterRecords;
      if (totalBacklogs !== undefined) studentDataUpdate.totalBacklogs = totalBacklogs;
      if (currentBacklogs !== undefined) studentDataUpdate.currentBacklogs = currentBacklogs;
      if (phoneNumber !== undefined) studentDataUpdate.phoneNumber = phoneNumber;
    } else if (isOwnProfile) {
      // Students can only update if not already set
      if (cgpa !== undefined && (existingData.cgpa === null || existingData.cgpa === undefined)) {
        studentDataUpdate.cgpa = cgpa;
      }
      if (tenthPercentage !== undefined && (existingData.tenthPercentage === null || existingData.tenthPercentage === undefined)) {
        studentDataUpdate.tenthPercentage = tenthPercentage;
      }
      if (twelfthPercentage !== undefined && (existingData.twelfthPercentage === null || existingData.twelfthPercentage === undefined)) {
        studentDataUpdate.twelfthPercentage = twelfthPercentage;
      }
    }
    
    // Fields students can always update
    if (skills !== undefined) studentDataUpdate.skills = skills;
    if (extracurricularActivities !== undefined) studentDataUpdate.extracurricularActivities = extracurricularActivities;
    if (internships !== undefined) studentDataUpdate.internships = internships;
    if (projects !== undefined) studentDataUpdate.projects = projects;
    if (certifications !== undefined) studentDataUpdate.certifications = certifications;
    if (achievements !== undefined) studentDataUpdate.achievements = achievements;
    if (resumeLink !== undefined) studentDataUpdate.resumeLink = resumeLink;
    if (placementPreferences !== undefined) studentDataUpdate.placementPreferences = placementPreferences;

    if (Object.keys(studentDataUpdate).length > 0) {
      await StudentData.findOneAndUpdate(
        { userId: userId },
        studentDataUpdate,
        { new: true }
      );
    }

    // Update user info (only moderators)
    if (isModerator) {
      const userUpdate = {};
      if (fullName) userUpdate.fullName = fullName;
      if (email) userUpdate.email = email;
      
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(userId, userUpdate);
      }
    }

    res.status(200).json({
      success: true,
      message: isModerator 
        ? 'Student profile updated successfully by moderator'
        : 'Profile updated successfully. Note: Personal and academic details cannot be changed once set.'
    });

  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// Export all functions
module.exports = {
  registerStudent: exports.registerStudent,
  getStudentProfile: exports.getStudentProfile,
  updateStudentProfile: exports.updateStudentProfile
};
