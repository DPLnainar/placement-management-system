import { Response } from 'express';
import Invitation from '../models/Invitation';
import sendEmail from '../utils/sendEmail';
import type { IAuthRequest } from '../types/index';

/**
 * POST /api/invitations
 * Create a single invitation
 */
export const createInvitation = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { email, fullName, rollNumber, department } = req.body;
        const collegeId = req.user.collegeId;
        const createdBy = req.user._id;

        // Check if invitation already exists for this email and college
        const existingInvitation = await Invitation.findOne({
            email,
            college: collegeId,
            status: { $in: ['pending', 'registered'] },
        });

        if (existingInvitation) {
            res.status(400).json({
                success: false,
                message: 'An active invitation already exists for this email',
            });
            return;
        }

        // Create invitation
        const invitation = new Invitation({
            email,
            fullName,
            rollNumber,
            department,
            college: collegeId,
            createdBy,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        invitation.generateToken();
        await invitation.save();

        // Send email
        try {
            const registrationLink = invitation.registrationLink;
            await sendEmail({
                to: email,
                subject: 'Student Registration Invitation',
                html: `
                    <h2>Welcome to the Placement Portal!</h2>
                    <p>Dear ${fullName},</p>
                    <p>You have been invited to register for the Placement Management System.</p>
                    <p><strong>Department:</strong> ${department}</p>
                    ${rollNumber ? `<p><strong>Roll Number:</strong> ${rollNumber}</p>` : ''}
                    <p>Click the link below to complete your registration:</p>
                    <p><a href="${registrationLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Registration</a></p>
                    <p>Or copy this link: ${registrationLink}</p>
                    <p>This invitation will expire in 7 days.</p>
                `,
                text: `You have been invited to register. Visit: ${registrationLink}`,
            });

            invitation.emailSent = true;
            invitation.emailSentAt = new Date();
            await invitation.save();
        } catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Invitation created successfully',
            data: {
                invitation: {
                    _id: invitation._id,
                    email: invitation.email,
                    fullName: invitation.fullName,
                    department: invitation.department,
                    status: invitation.status,
                    registrationLink: invitation.registrationLink,
                },
                registrationLink: invitation.registrationLink,
            },
        });
    } catch (error) {
        console.error('Create invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * POST /api/invitations/bulk
 * Create multiple invitations
 */
export const createBulkInvitations = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { invitations } = req.body;
        const collegeId = req.user.collegeId;
        const createdBy = req.user._id;

        if (!Array.isArray(invitations) || invitations.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Invitations array is required',
            });
            return;
        }

        console.log('Bulk invitation request:', {
            collegeId,
            createdBy,
            invitationsCount: invitations.length,
            firstInvitation: invitations[0],
        });

        // Validate collegeId exists
        if (!collegeId) {
            res.status(400).json({
                success: false,
                message: 'College ID not found. Please ensure your account is associated with a college.',
            });
            return;
        }

        const results = {
            successful: 0,
            failed: 0,
            skipped: 0,
            details: [] as any[],
        };

        for (const inv of invitations) {
            try {
                const { email, fullName, rollNumber, department } = inv;

                // Check if already exists
                const existing = await Invitation.findOne({
                    email,
                    college: collegeId,
                    status: { $in: ['pending', 'registered'] },
                });

                if (existing) {
                    results.skipped++;
                    results.details.push({ email, status: 'skipped', reason: 'Already exists' });
                    continue;
                }

                // Create invitation
                const invitation = new Invitation({
                    email,
                    fullName,
                    rollNumber,
                    department,
                    college: collegeId,
                    createdBy,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                });

                invitation.generateToken();
                await invitation.save();

                // Send email
                try {
                    const registrationLink = invitation.registrationLink;
                    await sendEmail({
                        to: email,
                        subject: 'Student Registration Invitation',
                        html: `
                            <h2>Welcome to the Placement Portal!</h2>
                            <p>Dear ${fullName},</p>
                            <p>You have been invited to register for the Placement Management System.</p>
                            <p><strong>Department:</strong> ${department}</p>
                            ${rollNumber ? `<p><strong>Roll Number:</strong> ${rollNumber}</p>` : ''}
                            <p>Click the link below to complete your registration:</p>
                            <p><a href="${registrationLink}">Complete Registration</a></p>
                            <p>This invitation will expire in 7 days.</p>
                        `,
                        text: `You have been invited to register. Visit: ${registrationLink}`,
                    });

                    invitation.emailSent = true;
                    invitation.emailSentAt = new Date();
                    await invitation.save();
                } catch (emailError) {
                    console.error(`Failed to send email to ${email}:`, emailError);
                }

                results.successful++;
                results.details.push({ email, status: 'success' });
            } catch (error) {
                console.error(`Failed to create invitation for ${inv.email}:`, error);

                // Log validation errors in detail
                if (error instanceof Error && 'errors' in error) {
                    const validationErrors = (error as any).errors;
                    console.error('Validation errors:', JSON.stringify(validationErrors, null, 2));
                }

                results.failed++;
                results.details.push({
                    email: inv.email,
                    status: 'failed',
                    reason: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Bulk invitation complete: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
            data: results,
        });
    } catch (error) {
        console.error('Bulk invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error,
        });
    }
};

/**
 * GET /api/invitations
 * Get all invitations for the college
 */
export const getInvitations = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const collegeId = req.user.collegeId;
        const { status } = req.query;

        const query: any = { college: collegeId };
        if (status) {
            query.status = status;
        }

        const invitations = await Invitation.find(query)
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });

        // Check and update expired invitations
        for (const invitation of invitations) {
            await invitation.checkExpiration();
        }

        res.json({
            success: true,
            data: {
                invitations,
                count: invitations.length,
            },
        });
    } catch (error) {
        console.error('Get invitations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * POST /api/invitations/:id/resend
 * Resend invitation email
 */
export const resendInvitation = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const collegeId = req.user.collegeId;

        const invitation = await Invitation.findOne({ _id: id, college: collegeId });

        if (!invitation) {
            res.status(404).json({
                success: false,
                message: 'Invitation not found',
            });
            return;
        }

        if (invitation.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: 'Can only resend pending invitations',
            });
            return;
        }

        // Check if expired
        await invitation.checkExpiration();
        if (invitation.status === 'expired') {
            res.status(400).json({
                success: false,
                message: 'Invitation has expired',
            });
            return;
        }

        // Send email
        const registrationLink = invitation.registrationLink;
        await sendEmail({
            to: invitation.email,
            subject: 'Student Registration Invitation (Reminder)',
            html: `
                <h2>Reminder: Complete Your Registration</h2>
                <p>Dear ${invitation.fullName},</p>
                <p>This is a reminder to complete your registration for the Placement Management System.</p>
                <p><strong>Department:</strong> ${invitation.department}</p>
                <p>Click the link below to complete your registration:</p>
                <p><a href="${registrationLink}">Complete Registration</a></p>
                <p>This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}.</p>
            `,
            text: `Reminder: Complete your registration. Visit: ${registrationLink}`,
        });

        invitation.resendCount += 1;
        invitation.lastResentAt = new Date();
        await invitation.save();

        res.json({
            success: true,
            message: 'Invitation email resent successfully',
        });
    } catch (error) {
        console.error('Resend invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * DELETE /api/invitations/:id
 * Cancel an invitation
 */
export const cancelInvitation = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const collegeId = req.user.collegeId;

        const invitation = await Invitation.findOne({ _id: id, college: collegeId });

        if (!invitation) {
            res.status(404).json({
                success: false,
                message: 'Invitation not found',
            });
            return;
        }

        if (invitation.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: 'Can only cancel pending invitations',
            });
            return;
        }

        invitation.status = 'cancelled';
        await invitation.save();

        res.json({
            success: true,
            message: 'Invitation cancelled successfully',
        });
    } catch (error) {
        console.error('Cancel invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
