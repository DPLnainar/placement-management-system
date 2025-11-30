const Invitation = require('../models/Invitation');
const User = require('../models/User');
const College = require('../models/College');
const sendEmail = require('../utils/sendEmail');

// Helper function to send invitation email
async function sendInvitationEmail(invitation, collegeId) {
  const college = await College.findById(collegeId);
  
  await sendEmail({
    to: invitation.email,
    subject: `Invitation to Join ${college?.name || 'College'} Placement Portal`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to the Placement Portal!</h2>
        <p>Hello <strong>${invitation.fullName}</strong>,</p>
        <p>You have been invited to register for the ${college?.name || 'College'} Placement Management System.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Your Details:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li>📧 Email: ${invitation.email}</li>
            <li>👤 Name: ${invitation.fullName}</li>
            ${invitation.rollNumber ? `<li>🎓 Roll Number: ${invitation.rollNumber}</li>` : ''}
            <li>🏫 Department: ${invitation.department}</li>
          </ul>
        </div>

        <p>Click the button below to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitation.registrationLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Registration
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          <a href="${invitation.registrationLink}">${invitation.registrationLink}</a>
        </p>

        <p style="color: #666; font-size: 14px;">
          ⏰ This invitation will expire in 48 hours.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't expect this invitation, please ignore this email.
        </p>
      </div>
    `
  });

  invitation.emailSent = true;
  invitation.emailSentAt = new Date();
  await invitation.save();
}

// Create single invitation
exports.createInvitation = async (req, res) => {
  try {
    const { email, fullName, rollNumber, department } = req.body;
    const userId = req.user.id;
    const userCollegeId = req.user.collegeId;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Check for pending invitation
    const existingInvitation = await Invitation.findOne({
      email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'An active invitation already exists for this email'
      });
    }

    // Create invitation
    const invitation = new Invitation({
      email,
      fullName,
      rollNumber,
      department,
      college: userCollegeId,
      createdBy: userId,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
    });

    invitation.generateToken();
    await invitation.save();

    // Send invitation email
    try {
      await sendInvitationEmail(invitation, userCollegeId);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Invitation created successfully',
      data: {
        invitation,
        registrationLink: invitation.registrationLink
      }
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invitation',
      error: error.message
    });
  }
};

// Create bulk invitations
exports.createBulkInvitations = async (req, res) => {
  try {
    const { invitations } = req.body;
    const userId = req.user.id;
    const userCollegeId = req.user.collegeId;

    if (!Array.isArray(invitations) || invitations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of invitations'
      });
    }

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    for (const inviteData of invitations) {
      try {
        const { email, fullName, rollNumber, department } = inviteData;

        if (!email || !fullName || !department) {
          results.failed.push({ email, reason: 'Missing required fields' });
          continue;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.skipped.push({ email, reason: 'User already exists' });
          continue;
        }

        const existingInvitation = await Invitation.findOne({
          email,
          status: 'pending',
          expiresAt: { $gt: new Date() }
        });

        if (existingInvitation) {
          results.skipped.push({ email, reason: 'Active invitation exists' });
          continue;
        }

        const invitation = new Invitation({
          email,
          fullName,
          rollNumber,
          department,
          college: userCollegeId,
          createdBy: userId,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
        });

        invitation.generateToken();
        await invitation.save();

        sendInvitationEmail(invitation, userCollegeId).catch(err => 
          console.error(`Email failed for ${email}:`, err)
        );

        results.successful.push({
          email,
          fullName,
          registrationLink: invitation.registrationLink
        });
      } catch (error) {
        results.failed.push({ email: inviteData.email, reason: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk invitation processing complete',
      data: {
        total: invitations.length,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        details: results
      }
    });
  } catch (error) {
    console.error('Bulk invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk invitations',
      error: error.message
    });
  }
};

// Get all invitations
exports.getInvitations = async (req, res) => {
  try {
    const userCollegeId = req.user.collegeId;
    const { status, page = 1, limit = 50 } = req.query;

    const query = { college: userCollegeId };
    if (status) {
      query.status = status;
    }

    const invitations = await Invitation.find(query)
      .populate('createdBy', 'fullName username')
      .populate('registeredUser', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invitation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        invitations,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations',
      error: error.message
    });
  }
};

// Verify invitation token
exports.verifyInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token })
      .populate('college', 'name code');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation link'
      });
    }

    await invitation.checkExpiration();

    if (!invitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: invitation.status === 'expired' 
          ? 'This invitation has expired' 
          : 'This invitation is no longer valid'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        email: invitation.email,
        fullName: invitation.fullName,
        rollNumber: invitation.rollNumber,
        department: invitation.department,
        college: invitation.college,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Verify invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying invitation',
      error: error.message
    });
  }
};

// Resend invitation email
exports.resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userCollegeId = req.user.collegeId;

    const invitation = await Invitation.findOne({
      _id: id,
      college: userCollegeId
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot resend this invitation'
      });
    }

    if (invitation.expiresAt < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      invitation.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    }

    await sendInvitationEmail(invitation, userCollegeId);

    invitation.resendCount += 1;
    invitation.lastResentAt = new Date();
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Invitation email resent successfully',
      data: { invitation }
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending invitation',
      error: error.message
    });
  }
};

// Cancel invitation
exports.cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userCollegeId = req.user.collegeId;

    const invitation = await Invitation.findOneAndUpdate(
      { _id: id, college: userCollegeId, status: 'pending' },
      { status: 'cancelled' },
      { new: true }
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or cannot be cancelled'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully',
      data: { invitation }
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling invitation',
      error: error.message
    });
  }
};

module.exports = exports;
