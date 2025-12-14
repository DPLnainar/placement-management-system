import { Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, College } from '@models/index';
import type { IAuthRequest } from '../types/index';
import { validateCaptcha, generateCaptcha } from '../utils/captcha';
import { validatePasswordStrength } from '../utils/passwordValidator';

/**
 * Constants for security
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
const ACCESS_TOKEN_EXPIRE = '24h'; // Extended for development convenience
const REFRESH_TOKEN_EXPIRE = '7d'; // Long-lived refresh token

/**
 * Generate JWT access token with user information
 * Token payload includes: userId, role, collegeId
 */
const generateToken = (user: any): string => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      collegeId: user.collegeId
    },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: ACCESS_TOKEN_EXPIRE } as jwt.SignOptions
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user: any): string => {
  return jwt.sign(
    {
      userId: user._id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    { expiresIn: REFRESH_TOKEN_EXPIRE } as jwt.SignOptions
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
 * 3. User's collegeId is already stored in their record
 * 4. System auto-links user to their assigned college
 * 5. JWT token includes the user's college assignment
 * 
 * Special case for SuperAdmin:
 * - SuperAdmin has no collegeId (can access all colleges)
 * - SuperAdmin login bypasses college validation
 */
export const login = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, captchaId, captchaInput } = req.body;

    // Validate input
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
      return;
    }

    // Validate captcha (temporarily disabled for development)
    if (process.env.NODE_ENV === 'production') {
      if (!captchaId || !captchaInput) {
        res.status(400).json({
          success: false,
          message: 'Please provide captcha'
        });
        return;
      }

      const isCaptchaValid = validateCaptcha(captchaId, captchaInput);
      if (!isCaptchaValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired captcha. Please try again.'
        });
        return;
      }
    }

    // Find user by username or email
    const query = {
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    };

    const users = await User.find(query)
      .select('+password +refreshToken')
      .populate('collegeId', 'name code location status subscriptionStatus');

    if (users.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Username or email not found'
      });
      return;
    }

    let user: any = null;

    // Check if any user is a SuperAdmin (takes precedence)
    const superAdminUser = users.find(u => u.role === 'superadmin');

    if (superAdminUser) {
      user = superAdminUser;
    } else {
      // Filter by collegeId if provided
      if (req.body.collegeId) {
        user = users.find(u => u.collegeId && (
          (u.collegeId as any)._id?.toString() === req.body.collegeId ||
          u.collegeId.toString() === req.body.collegeId
        ));
      } else {
        // If multiple users and no college selected, error
        if (users.length > 1) {
          res.status(401).json({
            success: false,
            message: 'Invalid username or password'
          });
          return;
        }
        user = users[0];
      }
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Username or email not found'
      });
      return;
    }

    // Check if account is locked
    /*
    if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
      const remainingTime = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
      res.status(403).json({
        success: false,
        message: `Account is locked due to multiple failed login attempts. Try again in ${remainingTime} minutes.`
      });
      return;
    }
    */

    // Check if account is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
      return;
    }

    // SuperAdmin login
    if (user.role === 'superadmin') {
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        // Increment failed attempts
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
          user.accountLockedUntil = new Date(Date.now() + LOCK_TIME);
          await user.save({ validateBeforeSave: false });
          res.status(403).json({
            success: false,
            message: 'Account locked due to multiple failed login attempts. Try again in 15 minutes.'
          });
          return;
        }
        await user.save({ validateBeforeSave: false });
        res.status(401).json({
          success: false,
          message: 'Incorrect password'
        });
        return;
      }

      if (user.status !== 'active') {
        res.status(403).json({
          success: false,
          message: 'Your account is currently inactive'
        });
        return;
      }

      // Reset failed attempts and update last login
      user.failedAttempts = 0;
      user.accountLockedUntil = undefined;
      user.lastLogin = new Date();

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.refreshToken;

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'SuperAdmin login successful',
        data: {
          user: {
            ...userResponse,
            college: null
          },
          token
        }
      });
      return;
    }

    // Regular user login - validate college
    if (!req.body.collegeId) {
      res.status(400).json({
        success: false,
        message: 'Please select your college to login'
      });
      return;
    }

    if (!user.collegeId) {
      res.status(403).json({
        success: false,
        message: 'User is not assigned to any college. Please contact administrator.'
      });
      return;
    }

    if ((user.collegeId as any).status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Your college is currently inactive. Please contact support.'
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact your administrator.'
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed attempts
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        user.accountLockedUntil = new Date(Date.now() + LOCK_TIME);
        await user.save({ validateBeforeSave: false });
        res.status(403).json({
          success: false,
          message: 'Account locked due to multiple failed login attempts. Try again in 15 minutes.'
        });
        return;
      }
      await user.save({ validateBeforeSave: false });
      res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
      return;
    }

    // Reset failed attempts and update last login
    user.failedAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lastLogin = new Date();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    const userData: any = {
      id: userResponse._id,
      username: userResponse.username,
      email: userResponse.email,
      fullName: userResponse.fullName,
      role: userResponse.role,
      status: userResponse.status,
      department: userResponse.department || null
    };

    if (userResponse.collegeId) {
      userData.college = {
        id: (userResponse.collegeId as any)._id,
        name: (userResponse.collegeId as any).name,
        code: (userResponse.collegeId as any).code,
        location: (userResponse.collegeId as any).location
      };
      userData.collegeId = (userResponse.collegeId as any)._id;
    } else {
      userData.college = null;
      userData.collegeId = null;
    }

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userData
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Get Current User Profile
 */
export const getProfile = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id)
      .select('-password')
      .populate('collegeId', 'name code location status')
      .populate('assignedBy', 'username fullName role');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: (user as any).fullName,
        role: user.role,
        college: user.collegeId,
        assignedBy: (user as any).assignedBy,
        status: user.status,
        createdAt: user.createdAt
      }
    });

  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

/**
 * Change Password
 */
export const changePassword = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet strength requirements',
        errors: passwordValidation.errors
      });
      return;
    }

    const user = await User.findById(req.user?._id).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const isPasswordValid = await (user as any).comparePassword(currentPassword);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

/**
 * Forgot Password
 */
export const forgotPassword = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      res.status(400).json({
        success: false,
        message: 'Please provide username and email'
      });
      return;
    }

    const user = await User.findOne({
      username: username.toLowerCase(),
      email: email.toLowerCase()
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'No user found with that username and email combination'
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    (user as any).resetPasswordToken = resetTokenHash;
    (user as any).resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // For now, return success without sending email (email utility not migrated yet)
    res.json({
      success: true,
      message: 'Password reset token generated',
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing forgot password request'
    });
  }
};

/**
 * Reset Password
 */
export const resetPassword = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Please provide reset token and new password'
      });
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet strength requirements',
        errors: passwordValidation.errors
      });
      return;
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    } as any);

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
      return;
    }

    user.password = newPassword;
    (user as any).resetPasswordToken = undefined;
    (user as any).resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password'
    });
  }
};

/**
 * Get Public Colleges
 */
export const getPublicColleges = async (_req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const colleges = await College.find({ status: 'active' })
      .select('name code location')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: colleges
    });

  } catch (error: any) {
    console.error('Get colleges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching colleges'
    });
  }
};

/**
 * Get Captcha
 * Generate and return a new captcha for login
 */
export const getCaptcha = async (_req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const captcha = generateCaptcha();

    res.json({
      success: true,
      data: {
        captchaId: captcha.captchaId,
        captchaCode: captcha.captchaCode,
        expiresAt: captcha.expiresAt
      }
    });

  } catch (error: any) {
    console.error('Get captcha error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating captcha'
    });
  }
};

/**
 * Logout
 * Clear refresh token from database and cookie
 */
export const logout = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Clear refresh token from database
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        refreshToken: undefined
      });
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

/**
 * Refresh Access Token
 * Generate new access token using refresh token
 */
export const refreshAccessToken = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      });
      return;
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret');
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
      return;
    }

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
      return;
    }

    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // Set new refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        token: newAccessToken
      }
    });

  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error refreshing token'
    });
  }
};

/**
 * Register Invited User
 */
export const registerInvited = async (_req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // TODO: Implement invitation-based registration
    res.status(501).json({
      success: false,
      message: 'Registration feature not yet implemented'
    });

  } catch (error: any) {
    console.error('Register invited error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * Register User (Admin/Student/Moderator)
 * 
 * Allows creating a new user account.
 * For Admin creation during setup.
 */
export const register = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password, fullName, role, collegeId, department } = req.body;

    // Validate required fields
    if (!username || !email || !password || !fullName || !role) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet strength requirements',
        errors: passwordValidation.errors
      });
      return;
    }

    // Validate collegeId for admin and moderator roles
    if ((role === 'admin' || role === 'moderator') && !collegeId) {
      res.status(400).json({
        success: false,
        message: 'College ID is required for admin and moderator accounts'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
      return;
    }

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      fullName,
      role,
      collegeId: collegeId || undefined,
      department: department || undefined,
      status: 'active',
      isActive: true
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: (user as any).fullName,
          role: user.role,
          collegeId: user.collegeId
        }
      }
    });

  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};
