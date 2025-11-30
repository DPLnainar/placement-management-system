const User = require('../models/User');
const College = require('../models/College');

/**
 * ⚠️⚠️⚠️ CRITICAL SECURITY NOTE ⚠️⚠️⚠️
 * 
 * ALL functions in this controller MUST use req.collegeId for data filtering
 * NEVER accept collegeId from req.params, req.body, or req.query
 * 
 * The verifyCollegeAdmin middleware sets req.collegeId from the authenticated user's token
 * This prevents College Admin A from accessing College B's data
 * 
 * Example SECURE query:
 *   const users = await User.find({ collegeId: req.collegeId, role: 'student' });
 * 
 * Example INSECURE query (DO NOT USE):
 *   const users = await User.find({ collegeId: req.body.collegeId });  // ❌ VULNERABLE!
 */

/**
 * Create User (Moderator or Student)
 * 
 * ADMIN and MODERATOR ENDPOINT
 * 
 * Critical Rules:
 * 1. Admins can create moderators and students for their college
 * 2. Moderators can ONLY create students in their own department
 * 3. Created user's collegeId automatically matches creator's collegeId
 * 4. assignedBy field is set to the creator's userId
 * 
 * This enforces the hierarchy:
 * - Developer creates admin → assigns to college manually in DB
 * - Admin creates moderators/students → automatically assigned to admin's college
 * - Moderator creates students → automatically assigned to moderator's department
 */
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role, department } = req.body;

    // Validate required fields
    if (!username || !email || !password || !fullName || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields: username, email, password, fullName, role' 
      });
    }

    // Role-based validation
    if (req.user.role === 'moderator') {
      // Moderators can ONLY create students
      if (role !== 'student') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Insufficient permissions.' 
        });
      }
      
      // Moderators can only assign to their own department
      if (department && department !== req.user.department) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Insufficient permissions.' 
        });
      }
    } else if (req.user.role === 'admin') {
      // Admins can create moderators and students
      if (!['moderator', 'student'].includes(role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Insufficient permissions.' 
        });
      }
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions to create users' 
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
        message: 'Username or email already exists' 
      });
    }

    // Get creator's college
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    // Verify college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ 
        success: false, 
        message: 'College not found' 
      });
    }

    // Determine department
    let userDepartment = department || '';
    
    // If moderator is creating student, automatically set to moderator's department
    if (req.user.role === 'moderator' && role === 'student') {
      userDepartment = req.user.department;
    }

    // Create new user
    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,  // Will be hashed by pre-save hook
      fullName,
      role,
      collegeId,  // Automatically set to creator's college
      assignedBy: req.user._id,  // Track who created this user
      status: 'active',
      isApproved: true,  // Auto-approve users created by admin/moderator
      department: userDepartment
    });

    await newUser.save();

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
      user: {
        id: userResponse._id,
        username: userResponse.username,
        email: userResponse.email,
        fullName: userResponse.fullName,
        role: userResponse.role,
        collegeId: userResponse.collegeId,
        assignedBy: userResponse.assignedBy,
        status: userResponse.status,
        isApproved: userResponse.isApproved,
        department: userResponse.department,
        isActive: userResponse.status === 'active'
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error creating user' 
    });
  }
};

/**
 * Get All Users in Admin's College
 * 
 * ADMIN/MODERATOR ENDPOINT
 * 
 * Returns users based on role:
 * - Admins see ALL users in their college
 * - Moderators see ONLY students in their department
 */
exports.getCollegeUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    
    // Build query filter
    const filter = { 
      collegeId: req.user.collegeId._id || req.user.collegeId 
    };

    // Optional filters
    if (role && ['admin', 'moderator', 'student'].includes(role)) {
      filter.role = role;
    }

    if (status && ['active', 'inactive', 'pending'].includes(status)) {
      filter.status = status;
    }

    // Moderators can only see students in their department
    if (req.user.role === 'moderator') {
      filter.role = 'student';  // Force to only students
      filter.department = req.user.department;  // Only their department
    }

    // Fetch users
    const users = await User.find(filter)
      .select('-password')
      .populate('assignedBy', 'username fullName role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        isActive: user.status === 'active',
        isApproved: user.isApproved || false,
        department: user.department || '',
        assignedBy: user.assignedBy,
        createdAt: user.createdAt
      }))
    });

  } catch (error) {
    console.error('Get college users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching users' 
    });
  }
};

/**
 * Get User by ID
 * 
 * ADMIN/MODERATOR ENDPOINT
 * 
 * Can only view users from the same college
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Students can only view their own profile
    if (req.user.role === 'student' && id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own profile'
      });
    }

    const user = await User.findOne({
      _id: id,
      collegeId: req.user.collegeId._id || req.user.collegeId
    })
      .select('-password')
      .populate('collegeId', 'name code location')
      .populate('assignedBy', 'username fullName role');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found or does not belong to your college' 
      });
    }

    // Return complete profile data
    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching user' 
    });
  }
};

/**
 * Update User Details
 * 
 * ADMIN and MODERATOR ENDPOINT
 * 
 * Admins can update any user in their college
 * Moderators can only update students in their department
 * Cannot change: role, collegeId
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('Update user - User ID:', id);
    console.log('Update data fields:', Object.keys(updateData));

    // Get collegeId from authenticated user
    const adminCollegeId = req.user.collegeId?._id || req.user.collegeId;
    
    if (!adminCollegeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'College ID not found' 
      });
    }

    // Build filter based on role
    const filter = {
      _id: id,
      collegeId: adminCollegeId
    };

    // Moderators can only update students in their department
    if (req.user.role === 'moderator') {
      filter.role = 'student';
      filter.department = req.user.department;
    }

    // Students can only update their own profile
    if (req.user.role === 'student') {
      if (id !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own profile'
        });
      }
    }

    // Find user and ensure they belong to college/department
    const user = await User.findOne(filter);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: req.user.role === 'moderator'
          ? 'Student not found in your department or access denied'
          : 'User not found or does not belong to your college'
      });
    }

    // Check if username already exists (if being changed)
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({ username: updateData.username });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already taken' 
        });
      }
    }

    // Check if email already exists (if being changed)
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await User.findOne({ email: updateData.email });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use' 
        });
      }
    }

    // List of fields that can be updated
    const allowedFields = [
      'username', 'email', 'fullName', 'department',
      'primaryEmail', 'secondaryEmail', 'primaryPhone', 'secondaryPhone',
      'dateOfBirth', 'gender', 'nationality', 'address',
      'passportNumber', 'passportPlaceOfIssue', 'passportIssueDate', 'passportExpiryDate',
      'tenthInstitution', 'tenthPercentage', 'tenthBoard', 'tenthYear',
      'twelfthInstitution', 'twelfthPercentage', 'twelfthBoard', 'twelfthYear',
      'currentInstitution', 'degree', 'branch', 'semester', 'cgpa', 'backlogs',
      'semesterWiseGPA', 'arrearHistory', 'skills',
      'github', 'linkedin', 'portfolio',
      'internships', 'extracurricular',
      'resumeLink', 'resumeFile'
    ];

    // Update only allowed fields
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating user',
      error: error.message
    });
  }
};

/**
 * Update User Status (activate/deactivate)
 * 
 * ADMIN and MODERATOR ENDPOINT
 * 
 * Admins can activate/deactivate any user in their college
 * Moderators can only activate/deactivate students in their department
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Update status - User ID:', id, 'Status:', status);
    console.log('Request user:', req.user);

    if (!['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: active, inactive, or pending' 
      });
    }

    // Get collegeId from authenticated user
    const adminCollegeId = req.user.collegeId?._id || req.user.collegeId;
    
    if (!adminCollegeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'College ID not found' 
      });
    }

    // Build filter based on role
    const filter = {
      _id: id,
      collegeId: adminCollegeId
    };

    // Moderators can only update students in their department
    if (req.user.role === 'moderator') {
      filter.role = 'student';
      filter.department = req.user.department;
    }

    // Find user and ensure they belong to college/department
    const user = await User.findOne(filter);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: req.user.role === 'moderator'
          ? 'Student not found in your department or access denied'
          : 'User not found or does not belong to your college'
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot change your own status' 
      });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: 'User status updated successfully',
      user: {
        id: user._id,
        username: user.username,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating user status' 
    });
  }
};

/**
 * Update User Approval
 * 
 * ADMIN ONLY ENDPOINT
 * 
 * Admin can approve/revoke approval for users in their college
 */
exports.updateUserApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.query;

    console.log('Update approval - User ID:', id, 'isApproved:', isApproved);
    console.log('Request user:', req.user);

    // Get collegeId from authenticated user
    const adminCollegeId = req.user.collegeId?._id || req.user.collegeId;
    
    if (!adminCollegeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin college ID not found' 
      });
    }

    // Find user and ensure they belong to admin's college
    const user = await User.findOne({
      _id: id,
      collegeId: adminCollegeId
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found or does not belong to your college' 
      });
    }

    // Prevent admin from changing their own approval
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot change your own approval status' 
      });
    }

    user.isApproved = isApproved === 'true';
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isApproved ? 'approved' : 'approval revoked'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('Update user approval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating user approval: ' + error.message 
    });
  }
};

/**
 * Delete User
 * 
 * ADMIN ONLY ENDPOINT
 * 
 * Admin can delete users from their college
 * Cannot delete themselves or other admins
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user and ensure they belong to admin's college
    const user = await User.findOne({
      _id: id,
      collegeId: req.user.collegeId._id || req.user.collegeId
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found or does not belong to your college' 
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot delete your own account' 
      });
    }

    // Prevent deleting other admins
    if (user.role === 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete admin users' 
      });
    }

    await User.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting user' 
    });
  }
};
