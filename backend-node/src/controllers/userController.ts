import { Response } from 'express';
import { User } from '../models/index';
import type { IAuthRequest } from '../types/index';

/**
 * Get All Users in Admin's College
 * 
 * ADMIN/MODERATOR ENDPOINT
 * 
 * Returns users based on role:
 * - Admins see ALL users in their college
 * - Moderators see ONLY students in their department
 */
export const getCollegeUsers = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { role, status } = req.query;

        // Build query filter
        const filter: any = {
            collegeId: req.user?.collegeId?._id || req.user?.collegeId
        };

        // Optional filters
        if (role && ['admin', 'moderator', 'student'].includes(role as string)) {
            filter.role = role;
        }

        if (status && ['active', 'inactive', 'pending'].includes(status as string)) {
            filter.status = status;
        }

        // Moderators can only see students in their department
        if (req.user?.role === 'moderator') {
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
                _id: user._id,
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status,
                isActive: user.status === 'active',
                isApproved: (user as any).isApproved || false,
                department: (user as any).department || '',
                assignedBy: (user as any).assignedBy,
                createdAt: user.createdAt
            }))
        });

    } catch (error: any) {
        console.error('Get college users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users'
        });
    }
};
