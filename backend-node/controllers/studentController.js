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
 * Students can update their own profile information
 */
exports.updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      fullName,
      phoneNumber,
      branch,
      yearOfStudy,
      rollNumber,
      cgpa,
      tenthPercentage,
      twelfthPercentage,
      skills
    } = req.body;

    // Update user info
    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;

    if (Object.keys(updateFields).length > 0) {
      await User.findByIdAndUpdate(userId, updateFields);
    }

    // Update student data
    const studentDataUpdate = {};
    if (phoneNumber !== undefined) studentDataUpdate.phoneNumber = phoneNumber;
    if (branch !== undefined) studentDataUpdate.branch = branch;
    if (yearOfStudy !== undefined) studentDataUpdate.yearOfStudy = yearOfStudy;
    if (rollNumber !== undefined) studentDataUpdate.rollNumber = rollNumber;
    if (cgpa !== undefined) studentDataUpdate.cgpa = cgpa;
    if (tenthPercentage !== undefined) studentDataUpdate.tenthPercentage = tenthPercentage;
    if (twelfthPercentage !== undefined) studentDataUpdate.twelfthPercentage = twelfthPercentage;
    if (skills !== undefined) studentDataUpdate.skills = skills;

    if (Object.keys(studentDataUpdate).length > 0) {
      await StudentData.findOneAndUpdate(
        { userId: userId },
        studentDataUpdate,
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
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
