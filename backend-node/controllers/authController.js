const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const College = require('../models/College');
const sendEmail = require('../utils/sendEmail');

/**
 * Generate JWT token with user information
 * Token payload includes: userId, role, collegeId
 * This allows middleware to perform authorization without additional DB queries
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      collegeId: user.collegeId
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

/**
 * Login Controller
 * 
 * CRITICAL: No college selection during login!
 * 
 * Flow:
 * 1. User provides username/email and password
 * 2. System looks up user in database
 * 3. User's collegeId is already stored in their record (assigned by admin or developer)
 * 4. System auto-links user to their assigned college
 * 5. JWT token includes the user's college assignment
 * 
 * Special case for SuperAdmin:
 * - SuperAdmin has no collegeId (can access all colleges)
 * - SuperAdmin login bypasses college validation
 * 
 * This ensures users are automatically associated with their pre-assigned college
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Find user by username or email (include password for comparison)
    // Find user by username or email (include password for comparison)
    // If collegeId is provided, use it to find the specific user
    // If not, we'll check for duplicates later
    const query = {
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    };

    // Don't filter by collegeId in the query yet.
    // We need to find SuperAdmins even if a college is selected (since they don't have a collegeId).
    // We will filter in memory.

    const users = await User.find(query)
      .select('+password')  // Include password for comparison
      .populate('collegeId', 'name code location status subscriptionStatus');

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username or email not found'
      });
    }

    let user = null;

    // STRATEGY:
    // 1. First, check if any of the found users is a SuperAdmin. SuperAdmin always takes precedence.
    const superAdminUser = users.find(u => u.role === 'superadmin');

    if (superAdminUser) {
      user = superAdminUser;
    } else {
      // 2. If not SuperAdmin, filter by the selected collegeId
      if (req.body.collegeId) {
        user = users.find(u => u.collegeId && (u.collegeId._id.toString() === req.body.collegeId || u.collegeId.toString() === req.body.collegeId));
      } else {
        // 3. If no college selected, and we have multiple users, it's ambiguous
        if (users.length > 1) {
          return res.status(401).json({
            success: false,
            message: 'Invalid username or password' // Generic error for security
          });
        }
        // If only one user, use them (but we enforce college selection for regular users later)
        user = users[0];
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username or email not found'
      });
    }

    // SuperAdmin login - no college validation needed
    if (user.role === 'superadmin') {
      // Verify password
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password'
        });
      }

      // Check if account is active
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Your account is currently inactive'
        });
      }

      // Generate token
      const token = generateToken(user);

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return res.status(200).json({
        success: true,
        message: 'SuperAdmin login successful',
        data: {
          user: {
            ...userResponse,
            college: null  // SuperAdmin has no specific college
          },
          token
        }
      });
    }

    // Regular user login - validate college
    // CRITICAL: Ensure college was explicitly selected
    if (!req.body.collegeId) {
      return res.status(400).json({
        success: false,
        message: 'Please select your college to login'
      });
    }

    // Check if user's college exists and is active
    if (!user.collegeId) {
      return res.status(403).json({
        success: false,
        message: 'User is not assigned to any college. Please contact administrator.'
      });
    }

    if (user.collegeId.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your college is currently inactive. Please contact support.'
      });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact your administrator.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from user object before sending response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Build user response object
    const userData = {
      id: userResponse._id,
      username: userResponse.username,
      email: userResponse.email,
      fullName: userResponse.fullName,
      role: userResponse.role,
      status: userResponse.status,
      department: userResponse.department || null
    };

    // Add college information only if collegeId exists (not null)
    if (userResponse.collegeId) {
      userData.college = {
        id: userResponse.collegeId._id,
        name: userResponse.collegeId.name,
        code: userResponse.collegeId.code,
        location: userResponse.collegeId.location
      };
      userData.collegeId = userResponse.collegeId._id;
    } else {
      // SuperAdmin has no college
      userData.college = null;
      userData.collegeId = null;
    }

    // Return user data with auto-linked college information
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userData
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Get Current User Profile
 * Returns authenticated user's information including their college
 */
exports.getProfile = async (req, res) => {
  try {
    // req.user is set by authenticate middleware
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('collegeId', 'name code location status')
      .populate('assignedBy', 'username fullName role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        college: user.collegeId,
        assignedBy: user.assignedBy,
        status: user.status,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

/**
 * Change Password
 * Allows users to change their own password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

/**
 * Forgot Password
 * Generates reset token and sends email with reset link
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and email'
      });
    }

    // Find user by username and email
    const user = await User.findOne({
      username: username.toLowerCase(),
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that username and email combination'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Create reset URL (frontend URL)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Create email content
    const emailText = `You requested a password reset for your College Placement System account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email and your password will remain unchanged.

Username: ${user.username}
Email: ${user.email}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Password Reset Request</h2>
        <p>You requested a password reset for your College Placement System account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #4F46E5; word-break: break-all;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This link will expire in <strong>1 hour</strong>.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this, please ignore this email and your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          <strong>Account Details:</strong><br>
          Username: ${user.username}<br>
          Email: ${user.email}
        </p>
      </div>
    `;

    // Send email
    let emailSent = false;
    try {
      // Check if email is configured
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD &&
        process.env.EMAIL_USER !== 'your-email@gmail.com') {
        await sendEmail({
          to: user.email,
          subject: 'Password Reset Request - College Placement System',
          text: emailText,
          html: emailHtml
        });
        emailSent = true;
        console.log('Password reset email sent to:', user.email);
      } else {
        console.log('Email not configured. Reset URL:', resetUrl);
        return res.status(500).json({
          success: false,
          message: 'Email service is not configured. Please contact administrator.'
        });
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again or contact administrator.'
      });
    }

    // Return success response (no reset URL shown)
    res.json({
      success: true,
      message: 'Password reset link has been sent to your registered email address'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request'
    });
  }
};

/**
 * Reset Password
 * Validates token and updates password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the token from URL to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

/**
 * Register Invited Student
 * Public endpoint for students to complete registration using invitation token
 */
/**
 * Get Public Colleges List
 * Returns list of active colleges for login selection
 */
exports.getPublicColleges = async (req, res) => {
  try {
    const colleges = await College.find({})
      .select('name code location')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: colleges.length,
      data: colleges
    });
  } catch (error) {
    console.error('Get public colleges error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching colleges'
    });
  }
};

exports.registerInvited = async (req, res) => {
  try {
    const { token, username, password } = req.body;

    // Validate input
    if (!token || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token, username, and password'
      });
    }

    // Find and verify invitation
    const Invitation = require('../models/Invitation');
    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation link'
      });
    }

    // Check if already used
    if (invitation.status === 'registered') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been used'
      });
    }

    // Check expiration
    await invitation.checkExpiration();
    if (!invitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: invitation.status === 'expired'
          ? 'This invitation has expired. Please contact your administrator.'
          : 'This invitation is no longer valid'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists. Please choose a different username.'
      });
    }

    // Create user account
    const user = await User.create({
      username: username.toLowerCase(),
      email: invitation.email,
      password,
      fullName: invitation.fullName,
      role: 'student',
      collegeId: invitation.college,
      department: invitation.department,
      status: 'active',
      isApproved: true
    });

    // Create student data record
    const StudentData = require('../models/StudentData');
    await StudentData.create({
      userId: user._id,
      rollNumber: invitation.rollNumber,
      department: invitation.department,
      branch: invitation.department,
      primaryEmail: invitation.email,
      fullName: invitation.fullName
    });

    // Update invitation status
    invitation.status = 'registered';
    invitation.registeredAt = new Date();
    invitation.registeredUser = user._id;
    await invitation.save();

    // Generate token for auto-login
    const authToken = generateToken(user);

    // Populate college info
    await user.populate('collegeId', 'name code location');

    // Prepare user response
    const userResponse = user.toObject();
    delete userResponse.password;

    const userData = {
      id: userResponse._id,
      username: userResponse.username,
      email: userResponse.email,
      fullName: userResponse.fullName,
      role: userResponse.role,
      status: userResponse.status,
      department: userResponse.department,
      college: userResponse.collegeId ? {
        id: userResponse.collegeId._id,
        name: userResponse.collegeId.name,
        code: userResponse.collegeId.code,
        location: userResponse.collegeId.location
      } : null,
      collegeId: userResponse.collegeId?._id
    };

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully! You can now access your dashboard.',
      data: {
        token: authToken,
        user: userData
      }
    });

  } catch (error) {
    console.error('Register invited error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

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
      message: 'Error completing registration',
      error: error.message
    });
  }
};
