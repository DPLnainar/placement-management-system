import { Response } from 'express';
import { User, Moderator } from '../models';
import { IAuthRequest } from '../types';

/**
 * Create a new moderator
 * Creates both a User record (for login) and a Moderator record (for permissions)
 */
export const createModerator = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { username, email, password, fullName, department, permissions, departments } = req.body;

        // Validation
        if (!username || !email || !password || !fullName || !departments) {
            res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
            return;
        }

        // Get admin's collegeId (moderators belong to same college)
        let collegeId = (req.user as any).collegeId;

        // Handle populated collegeId
        if (collegeId && typeof collegeId === 'object' && '_id' in collegeId) {
            collegeId = collegeId._id;
        }

        if (!collegeId) {
            res.status(400).json({
                success: false,
                message: 'Admin must belong to a college to create moderators'
            });
            return;
        }

        // Check for existing user
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

        // Department Restriction Check
        // If the creating Admin has a specific department assigned, they can ONLY create moderators for that department.
        const adminDept = (req.user as any).department;
        if (adminDept) {
            // Check primary department
            const targetDept = department || (departments && departments[0]);
            if (targetDept && targetDept !== adminDept) {
                res.status(403).json({
                    success: false,
                    message: `You can only create moderators for your own department: ${adminDept}`
                });
                return;
            }

            // Check departments array if provided
            if (departments && Array.isArray(departments)) {
                const invalidDepts = departments.filter((d: string) => d !== adminDept);
                if (invalidDepts.length > 0) {
                    res.status(403).json({
                        success: false,
                        message: `You can only assign your own department: ${adminDept}`
                    });
                    return;
                }
            }
        }

        // 1. Create User
        const user = await User.create({
            username,
            email,
            password, // Hashed by pre-save hook
            fullName,
            role: 'moderator',
            collegeId,
            department: department || (departments && departments[0]), // Primary department
            isActive: true,
            status: 'active',
            assignedBy: req.user?._id
        });

        // 2. Create Moderator Profile
        const moderator = await Moderator.create({
            userId: user._id,
            collegeId,
            departments: Array.isArray(departments) ? departments : [departments],
            permissions: permissions || [],
            isActive: true,
            assignedBy: req.user?._id
        });

        res.status(201).json({
            success: true,
            message: 'Moderator created successfully',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName
                },
                moderator
            }
        });

    } catch (error: any) {
        console.error('Error creating moderator:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating moderator',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * List all moderators for the current college
 */
export const listModerators = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const collegeId = (req.user as any).collegeId;

        // Find users with role 'moderator' and matching college
        // We can query Moderator collection or User collection.
        // Querying Moderator is better for details.

        const moderators = await Moderator.find({ collegeId })
            .populate('userId', 'username email fullName department status lastLogin')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: moderators
        });

    } catch (error: any) {
        console.error('Error listing moderators:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching moderators'
        });
    }
};

/**
 * Update moderator
 */
export const updateModerator = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // This is likely the User ID or Moderator ID? User provided ':id'. standard is usually ID of resource (Moderator).
        const { fullName, email, department, departments, permissions } = req.body;

        // Find Moderator
        const moderator = await Moderator.findById(id);
        if (!moderator) {
            // Try treating ID as User ID
            const modByUserId = await Moderator.findOne({ userId: id });
            if (!modByUserId) {
                res.status(404).json({ success: false, message: 'Moderator not found' });
                return;
            }
            // Proceed with modByUserId
            // TODO: Clean this up. Assuming :id is Moderator._id as per route convention.
        }

        // Let's assume ID is Moderator ID for now
        const mod = moderator || await Moderator.findOne({ userId: id });
        if (!mod) {
            res.status(404).json({ success: false, message: 'Moderator not found' });
            return;
        }

        // Update Moderator fields
        if (departments) mod.departments = departments;
        if (permissions) mod.permissions = permissions;
        await mod.save();

        // Update User fields
        const user = await User.findById(mod.userId);
        if (user) {
            if (fullName) user.fullName = fullName;
            if (email) user.email = email;
            if (department) user.department = department;
            await user.save();
        }

        res.json({
            success: true,
            message: 'Moderator updated successfully',
            data: mod
        });

    } catch (error: any) {
        console.error('Error updating moderator:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating moderator'
        });
    }
};

/**
 * Toggle moderator status
 */
export const toggleModeratorStatus = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Find Moderator
        const moderator = await Moderator.findById(id);
        if (!moderator) {
            res.status(404).json({ success: false, message: 'Moderator not found' });
            return;
        }

        // Toggle
        moderator.isActive = !moderator.isActive;
        await moderator.save();

        // Sync with User
        const user = await User.findById(moderator.userId);
        if (user) {
            user.isActive = moderator.isActive;
            user.status = moderator.isActive ? 'active' : 'inactive';
            await user.save();
        }

        res.json({
            success: true,
            message: `Moderator ${moderator.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { isActive: moderator.isActive }
        });

    } catch (error: any) {
        console.error('Error toggling moderator status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating status'
        });
    }
};
