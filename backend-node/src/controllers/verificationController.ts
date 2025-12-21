import { Response } from 'express';
import StudentData from '../models/StudentData';
import { IAuthRequest } from '../types';

/**
 * Get verification queue for moderator's department
 * Returns students with PENDING verification status
 */
export const getVerificationQueue = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const moderatorDept = req.user?.department;
        const collegeId = req.user?.collegeId;

        if (!moderatorDept) {
            res.status(400).json({ success: false, message: 'Moderator department not found' });
            return;
        }

        // Find students in moderator's department with PENDING status
        const pendingStudents = await StudentData.find({
            collegeId,
            'personal.branch': moderatorDept,
            verificationStatus: 'PENDING'
        })
            .populate('userId', 'fullName email username')
            .sort({ lastVerificationRequest: -1 }); // Newest first

        // Format response
        const queueItems = pendingStudents.map(student => ({
            studentId: student._id,
            userId: (student.userId as any)._id,
            fullName: (student.userId as any).fullName || student.personal?.name,
            registrationNumber: student.rollNumber || student.personal?.rollNumber,
            email: (student.userId as any).email || student.personal?.email,
            verificationStatus: student.verificationStatus,
            lastVerificationRequest: student.lastVerificationRequest,
            verificationTriggers: student.verificationTriggers || [],
            cgpa: student.cgpa,
            semester: student.semester
        }));

        res.status(200).json({
            success: true,
            count: queueItems.length,
            data: queueItems
        });

    } catch (error: any) {
        console.error('Error in getVerificationQueue:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get count of pending verifications for badge
 */
export const getQueueCount = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const moderatorDept = req.user?.department;
        const collegeId = req.user?.collegeId;

        if (!moderatorDept) {
            res.status(400).json({ success: false, message: 'Moderator department not found' });
            return;
        }

        const count = await StudentData.countDocuments({
            collegeId,
            'personal.branch': moderatorDept,
            verificationStatus: 'PENDING'
        });

        res.status(200).json({
            success: true,
            count
        });

    } catch (error: any) {
        console.error('Error in getQueueCount:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get detailed student information for verification
 * Includes all profile data and S3 document URLs
 */
export const getVerificationDetails = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const moderatorDept = req.user?.department;
        const collegeId = req.user?.collegeId;

        console.log('\n\n========================================');
        console.log('🔍 VERIFICATION DETAILS REQUEST');
        console.log('========================================');
        console.log('📋 Request Info:');
        console.log('  Student ID:', studentId);
        console.log('  URL:', req.url);
        console.log('  Method:', req.method);
        console.log('\n👤 Moderator Info (from req.user):');
        console.log('  User ID:', req.user?._id);
        console.log('  Role:', req.user?.role);
        console.log('  College ID:', collegeId);
        console.log('  College ID Type:', typeof collegeId);
        console.log('  Department:', moderatorDept);

        if (!moderatorDept) {
            console.log('❌ FAILED: Moderator department not found');
            res.status(400).json({ success: false, message: 'Moderator department not found' });
            return;
        }

        const student = await StudentData.findById(studentId)
            .populate('userId', 'fullName email username');

        if (!student) {
            console.log('❌ FAILED: Student not found');
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }

        console.log('\n👨‍🎓 Student Info (from database):');
        console.log('  Student ID:', student._id);
        console.log('  College ID:', student.collegeId);
        console.log('  College ID Type:', typeof student.collegeId);
        console.log('  Department:', student.personal?.branch);

        console.log('\n🔍 Authorization Checks:');
        console.log('  1. College ID Comparison:');
        console.log('     Moderator:', collegeId?.toString());
        console.log('     Student:', student.collegeId?.toString());
        console.log('     Match?', student.collegeId?.toString() === collegeId?.toString());

        console.log('  2. Department Comparison:');
        console.log('     Moderator:', moderatorDept);
        console.log('     Student:', student.personal?.branch);
        console.log('     Match?', student.personal?.branch === moderatorDept);

        // Verify student is in moderator's department
        if (student.personal?.branch !== moderatorDept) {
            console.log('\n❌ AUTHORIZATION FAILED: Department mismatch');
            console.log('   Expected:', moderatorDept);
            console.log('   Got:', student.personal?.branch);
            res.status(403).json({ success: false, message: 'Unauthorized: Student not in your department' });
            return;
        }

        // Verify student is in same college
        // Handle case where collegeId might be null/undefined
        if (!collegeId) {
            console.log('\n❌ AUTHORIZATION FAILED: Moderator has no college ID');
            res.status(403).json({ success: false, message: 'Moderator college information missing' });
            return;
        }

        if (!student.collegeId) {
            console.log('\n❌ AUTHORIZATION FAILED: Student has no college ID');
            res.status(403).json({ success: false, message: 'Student college information missing' });
            return;
        }

        if (student.collegeId.toString() !== collegeId.toString()) {
            console.log('\n❌ AUTHORIZATION FAILED: College ID mismatch');
            console.log('   Moderator College:', collegeId.toString());
            console.log('   Student College:', student.collegeId.toString());
            res.status(403).json({ success: false, message: 'Unauthorized: Student not in your college' });
            return;
        }

        console.log('\n✅ AUTHORIZATION PASSED - Returning student data');
        console.log('========================================\n');

        res.status(200).json({
            success: true,
            data: student
        });

    } catch (error: any) {
        console.error('\n❌ ERROR in getVerificationDetails:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Approve student verification
 * Sets status to VERIFIED and records moderator details
 */
export const approveVerification = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { notes } = req.body;
        const moderatorUserId = req.user?._id;
        const moderatorDept = req.user?.department;
        const collegeId = req.user?.collegeId;

        if (!moderatorUserId || !moderatorDept) {
            res.status(400).json({ success: false, message: 'Moderator information not found' });
            return;
        }

        const student = await StudentData.findById(studentId);

        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }

        // Verify authorization
        if (student.personal?.branch !== moderatorDept) {
            res.status(403).json({ success: false, message: 'Unauthorized: Student not in your department' });
            return;
        }

        if (student.collegeId?.toString() !== collegeId?.toString()) {
            res.status(403).json({ success: false, message: 'Unauthorized: Student not in your college' });
            return;
        }

        // Update verification status
        student.verificationStatus = 'VERIFIED';
        student.documentsVerified = true;
        student.verifiedBy = moderatorUserId as any;
        student.verificationDate = new Date();
        student.verificationNotes = notes || 'Approved by moderator';
        student.verificationRejectionReason = undefined; // Clear any previous rejection reason

        await student.save();

        res.status(200).json({
            success: true,
            message: 'Student verification approved successfully',
            data: {
                studentId: student._id,
                verificationStatus: student.verificationStatus,
                verifiedBy: student.verifiedBy,
                verificationDate: student.verificationDate
            }
        });

    } catch (error: any) {
        console.error('Error in approveVerification:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Reject student verification
 * Sets status to REJECTED with reason
 */
export const rejectVerification = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { reason } = req.body;
        const moderatorUserId = req.user?._id;
        const moderatorDept = req.user?.department;
        const collegeId = req.user?.collegeId;

        if (!moderatorUserId || !moderatorDept) {
            res.status(400).json({ success: false, message: 'Moderator information not found' });
            return;
        }

        if (!reason || reason.trim().length === 0) {
            res.status(400).json({ success: false, message: 'Rejection reason is required' });
            return;
        }

        const student = await StudentData.findById(studentId);

        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }

        // Verify authorization
        if (student.personal?.branch !== moderatorDept) {
            res.status(403).json({ success: false, message: 'Unauthorized: Student not in your department' });
            return;
        }

        if (student.collegeId?.toString() !== collegeId?.toString()) {
            res.status(403).json({ success: false, message: 'Unauthorized: Student not in your college' });
            return;
        }

        // Update verification status
        student.verificationStatus = 'REJECTED';
        student.documentsVerified = false;
        student.verifiedBy = moderatorUserId as any;
        student.verificationDate = new Date();
        student.verificationRejectionReason = reason.trim();
        student.verificationNotes = `Rejected: ${reason.trim()}`;

        await student.save();

        res.status(200).json({
            success: true,
            message: 'Student verification rejected',
            data: {
                studentId: student._id,
                verificationStatus: student.verificationStatus,
                verificationRejectionReason: student.verificationRejectionReason,
                verifiedBy: student.verifiedBy,
                verificationDate: student.verificationDate
            }
        });

    } catch (error: any) {
        console.error('Error in rejectVerification:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
