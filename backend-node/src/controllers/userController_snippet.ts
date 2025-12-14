
import { Request, Response } from 'express';
import { User } from '../models/index';
import type { IAuthRequest } from '../types/index';
// ... existing imports

/**
 * Create User (Admin/Moderator only)
 * 
 * Allows Admins/Moderators to create users (mainly Students) 
 * without logging them in (no cookies/tokens set).
 */
export const createUser = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { username, email, password, fullName, role, department, collegeId } = req.body;

        // 1. Validation
        if (!username || !email || !password || !fullName || !role) {
            res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
            return;
        }

        // Only allow creating 'student' or 'moderator' (though moderators should use the dedicated endpoint)
        if (!['student', 'moderator'].includes(role)) {
            res.status(400).json({
                success: false,
                message: 'Invalid role. Only students and moderators can be created.'
            });
            return;
        }

        // 2. Permission Check
        // Admins can create Students and Moderators
        // Moderators can ONLY create Students in their own department
        if (req.user?.role === 'moderator') {
            if (role !== 'student') {
                res.status(403).json({ success: false, message: 'Moderators can only create students' });
                return;
            }
            // Enforce department
            if (department && department !== req.user.department) {
                res.status(403).json({ success: false, message: 'Moderators can only create students in their own department' });
                return;
            }
        }

        // 3. Check Existence
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
            return;
        }

        // 4. Create User
        // Use requester's collegeId if not provided (for moderators/admins creating users in their college)
        const targetCollegeId = collegeId || req.user?.collegeId;

        const user = await User.create({
            username,
            email,
            password,
            fullName,
            role,
            collegeId: targetCollegeId,
            department,
            isActive: true,
            status: 'active',
            assignedBy: req.user?._id
        });

        // 5. Response (NO TOKEN)
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    department: user.department
                }
            }
        });

    } catch (error: any) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating user',
            error: error.message
        });
    }
};
