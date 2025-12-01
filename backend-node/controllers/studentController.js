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

/**
 * Add/Update Education History
 */
exports.updateEducation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { tenth, twelfth, graduation, postGraduation } = req.body;

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Update education fields
    if (tenth) studentData.education.tenth = { ...studentData.education?.tenth, ...tenth };
    if (twelfth) studentData.education.twelfth = { ...studentData.education?.twelfth, ...twelfth };
    if (graduation) studentData.education.graduation = { ...studentData.education?.graduation, ...graduation };
    if (postGraduation) studentData.education.postGraduation = { ...studentData.education?.postGraduation, ...postGraduation };

    // Update legacy fields for backward compatibility
    if (tenth?.percentage) studentData.tenthPercentage = tenth.percentage;
    if (twelfth?.percentage) studentData.twelfthPercentage = twelfth.percentage;
    if (graduation?.cgpa) studentData.cgpa = graduation.cgpa;

    await studentData.save();

    res.json({
      success: true,
      message: 'Education history updated successfully',
      education: studentData.education,
      profileCompletion: studentData.profileCompletionPercentage
    });

  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating education history'
    });
  }
};

/**
 * Add/Update Technical Skills
 */
exports.updateSkills = async (req, res) => {
  try {
    const userId = req.user._id;
    const { programming, frameworks, tools, databases, cloud, other, softSkills, languages } = req.body;

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Update technical skills
    if (programming) studentData.technicalSkills.programming = programming;
    if (frameworks) studentData.technicalSkills.frameworks = frameworks;
    if (tools) studentData.technicalSkills.tools = tools;
    if (databases) studentData.technicalSkills.databases = databases;
    if (cloud) studentData.technicalSkills.cloud = cloud;
    if (other) studentData.technicalSkills.other = other;

    // Update soft skills and languages
    if (softSkills) studentData.softSkills = softSkills;
    if (languages) studentData.languages = languages;

    await studentData.save();

    res.json({
      success: true,
      message: 'Skills updated successfully',
      technicalSkills: studentData.technicalSkills,
      softSkills: studentData.softSkills,
      languages: studentData.languages,
      profileCompletion: studentData.profileCompletionPercentage
    });

  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating skills'
    });
  }
};

/**
 * Add Project
 */
exports.addProject = async (req, res) => {
  try {
    const userId = req.user._id;
    const projectData = req.body;

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    studentData.projects.push(projectData);
    await studentData.save();

    res.json({
      success: true,
      message: 'Project added successfully',
      project: studentData.projects[studentData.projects.length - 1],
      totalProjects: studentData.projects.length,
      profileCompletion: studentData.profileCompletionPercentage
    });

  } catch (error) {
    console.error('Add project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding project'
    });
  }
};

/**
 * Update Project
 */
exports.updateProject = async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;
    const updates = req.body;

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const project = studentData.projects.id(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    Object.assign(project, updates);
    await studentData.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project'
    });
  }
};

/**
 * Delete Project
 */
exports.deleteProject = async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.params;

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    studentData.projects.pull(projectId);
    await studentData.save();

    res.json({
      success: true,
      message: 'Project deleted successfully',
      totalProjects: studentData.projects.length
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project'
    });
  }
};

/**
 * Add Experience (Internship or Work)
 */
exports.addExperience = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, ...experienceData } = req.body; // type: 'internship' or 'work'

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    if (type === 'internship') {
      studentData.internships.push(experienceData);
    } else if (type === 'work') {
      studentData.workExperience.push(experienceData);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid experience type. Use "internship" or "work"'
      });
    }

    await studentData.save();

    res.json({
      success: true,
      message: `${type === 'internship' ? 'Internship' : 'Work experience'} added successfully`,
      totalExperienceMonths: studentData.getTotalExperience(),
      profileCompletion: studentData.profileCompletionPercentage
    });

  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding experience'
    });
  }
};

/**
 * Add Certification
 */
exports.addCertification = async (req, res) => {
  try {
    const userId = req.user._id;
    const certificationData = req.body;

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    studentData.certifications.push(certificationData);
    await studentData.save();

    res.json({
      success: true,
      message: 'Certification added successfully',
      certification: studentData.certifications[studentData.certifications.length - 1],
      totalCertifications: studentData.certifications.length,
      profileCompletion: studentData.profileCompletionPercentage
    });

  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding certification'
    });
  }
};

/**
 * Add Achievement
 */
exports.addAchievement = async (req, res) => {
  try {
    const userId = req.user._id;
    const achievementData = req.body;

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    studentData.achievements.push(achievementData);
    await studentData.save();

    res.json({
      success: true,
      message: 'Achievement added successfully',
      achievement: studentData.achievements[studentData.achievements.length - 1],
      totalAchievements: studentData.achievements.length,
      profileCompletion: studentData.profileCompletionPercentage
    });

  } catch (error) {
    console.error('Add achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding achievement'
    });
  }
};

/**
 * Update Social Profiles
 */
exports.updateSocialProfiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const profiles = req.body;

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    studentData.socialProfiles = { ...studentData.socialProfiles, ...profiles };
    await studentData.save();

    res.json({
      success: true,
      message: 'Social profiles updated successfully',
      socialProfiles: studentData.socialProfiles
    });

  } catch (error) {
    console.error('Update social profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating social profiles'
    });
  }
};

/**
 * Update Coding Stats
 */
exports.updateCodingStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = req.body;

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    studentData.codingStats = { ...studentData.codingStats, ...stats };
    await studentData.save();

    res.json({
      success: true,
      message: 'Coding stats updated successfully',
      codingStats: studentData.codingStats
    });

  } catch (error) {
    console.error('Update coding stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating coding stats'
    });
  }
};

/**
 * Get Profile Strength Analysis
 */
exports.getProfileStrength = async (req, res) => {
  try {
    const userId = req.user._id;

    const studentData = await StudentData.findOne({ userId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const strength = studentData.getProfileStrength();
    const totalExperience = studentData.getTotalExperience();
    const allSkills = studentData.getAllSkills();

    res.json({
      success: true,
      profileStrength: strength,
      analytics: {
        totalExperienceMonths: totalExperience,
        totalExperienceYears: Math.floor(totalExperience / 12),
        totalSkills: allSkills.length,
        skills: allSkills,
        totalProjects: studentData.projects?.length || 0,
        totalCertifications: studentData.certifications?.length || 0,
        totalAchievements: studentData.achievements?.length || 0,
        hasResume: !!studentData.resumeUrl
      }
    });

  } catch (error) {
    console.error('Get profile strength error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting profile strength'
    });
  }
};

// Update exports
module.exports = {
  registerStudent: exports.registerStudent,
  getStudentProfile: exports.getStudentProfile,
  updateStudentProfile: exports.updateStudentProfile,
  updateEducation: exports.updateEducation,
  updateSkills: exports.updateSkills,
  addProject: exports.addProject,
  updateProject: exports.updateProject,
  deleteProject: exports.deleteProject,
  addExperience: exports.addExperience,
  addCertification: exports.addCertification,
  addAchievement: exports.addAchievement,
  updateSocialProfiles: exports.updateSocialProfiles,
  updateCodingStats: exports.updateCodingStats,
  getProfileStrength: exports.getProfileStrength
};
