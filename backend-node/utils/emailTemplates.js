/**
 * Email Templates for Placement Management System
 * Centralized email HTML templates
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Base email template wrapper
 */
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Placement Portal</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; text-align: center;">
                🎓 Placement Portal
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} College Placement Management System
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Welcome Email for New Users
 */
const welcomeEmail = ({ fullName, username, role, collegeName }) => {
  const roleNames = {
    student: 'Student',
    moderator: 'Moderator',
    admin: 'Administrator'
  };

  const content = `
    <h2 style="color: #1f2937; margin-top: 0;">Welcome to the Placement Portal! 👋</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hello <strong>${fullName}</strong>,
    </p>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Your account has been successfully created as a <strong>${roleNames[role]}</strong> 
      ${collegeName ? `at <strong>${collegeName}</strong>` : ''}.
    </p>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 6px;">
      <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold;">Your Login Credentials:</p>
      <p style="margin: 5px 0; color: #1e3a8a;"><strong>Username:</strong> ${username}</p>
      <p style="margin: 5px 0; color: #1e3a8a;"><strong>Role:</strong> ${roleNames[role]}</p>
    </div>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Please login and complete your profile to get started.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${FRONTEND_URL}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                font-weight: bold; font-size: 16px;">
        Login to Portal
      </a>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⚠️ Security Tip:</strong> Please change your password after your first login.
      </p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Invitation Email for Students
 */
const invitationEmail = ({ fullName, email, collegeName, invitationToken, expiresAt }) => {
  const registrationLink = `${FRONTEND_URL}/register/${invitationToken}`;
  const expiryDate = new Date(expiresAt).toLocaleDateString();

  const content = `
    <h2 style="color: #1f2937; margin-top: 0;">You're Invited! 🎉</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hello <strong>${fullName}</strong>,
    </p>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      You have been invited to join the <strong>${collegeName}</strong> Placement Portal. 
      This portal will help you stay updated on job opportunities, campus placements, and application tracking.
    </p>

    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 6px;">
      <p style="margin: 0 0 10px 0; color: #065f46; font-weight: bold;">Registration Details:</p>
      <p style="margin: 5px 0; color: #064e3b;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 5px 0; color: #064e3b;"><strong>College:</strong> ${collegeName}</p>
      <p style="margin: 5px 0; color: #064e3b;"><strong>Valid Until:</strong> ${expiryDate}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${registrationLink}" 
         style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                font-weight: bold; font-size: 16px;">
        Complete Registration
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      Or copy and paste this link in your browser:<br>
      <a href="${registrationLink}" style="color: #3b82f6; word-break: break-all;">${registrationLink}</a>
    </p>

    <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 6px;">
      <p style="margin: 0; color: #991b1b; font-size: 14px;">
        <strong>⏰ Important:</strong> This invitation expires on ${expiryDate}. 
        Please complete your registration before the deadline.
      </p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Password Reset Email
 */
const passwordResetEmail = ({ fullName, resetToken, expiresIn = '1 hour' }) => {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const content = `
    <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password 🔐</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hello <strong>${fullName}</strong>,
    </p>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" 
         style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); 
                color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                font-weight: bold; font-size: 16px;">
        Reset Password
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      Or copy and paste this link in your browser:<br>
      <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a>
    </p>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⏰ This link will expire in ${expiresIn}.</strong>
      </p>
    </div>

    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 6px;">
      <p style="margin: 0; color: #1e40af; font-size: 14px;">
        <strong>🛡️ Security Notice:</strong> If you didn't request this password reset, 
        please ignore this email or contact your administrator.
      </p>
    </div>
  `;

  return baseTemplate(content);
};

/**
 * Application Submitted Confirmation
 */
const applicationSubmittedEmail = ({ fullName, jobTitle, company, applicationDate }) => {
  const content = `
    <h2 style="color: #1f2937; margin-top: 0;">Application Submitted Successfully ✅</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hello <strong>${fullName}</strong>,
    </p>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Your application has been successfully submitted!
    </p>

    <div style="background-color: #f0fdf4; border: 2px solid #10b981; padding: 25px; margin: 30px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #065f46;">Application Details</h3>
      <p style="margin: 8px 0; color: #064e3b;"><strong>Position:</strong> ${jobTitle}</p>
      <p style="margin: 8px 0; color: #064e3b;"><strong>Company:</strong> ${company}</p>
      <p style="margin: 8px 0; color: #064e3b;"><strong>Submitted On:</strong> ${new Date(applicationDate).toLocaleString()}</p>
    </div>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Your application is now under review. We'll notify you once there's an update on your application status.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${FRONTEND_URL}/applications" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                font-weight: bold; font-size: 16px;">
        Track Application
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
      Good luck with your application! 🍀
    </p>
  `;

  return baseTemplate(content);
};

/**
 * Job Offer Letter Email
 */
const offerLetterEmail = ({ fullName, jobTitle, company, package: pkg, joiningDate }) => {
  const content = `
    <h2 style="color: #1f2937; margin-top: 0;">🎉 Congratulations! Offer Letter Received</h2>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Dear <strong>${fullName}</strong>,
    </p>
    <p style="color: #4b5563; font-size: 20px; line-height: 1.6; font-weight: bold; color: #059669;">
      We're thrilled to inform you that you've been selected! 🎊
    </p>

    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                padding: 30px; margin: 30px 0; border-radius: 12px; color: white; text-align: center;">
      <h3 style="margin: 0 0 20px 0; font-size: 24px;">${jobTitle}</h3>
      <p style="margin: 10px 0; font-size: 18px;"><strong>${company}</strong></p>
      ${pkg ? `<p style="margin: 10px 0; font-size: 22px; font-weight: bold;">Package: ₹${pkg} LPA</p>` : ''}
      ${joiningDate ? `<p style="margin: 10px 0;">Tentative Joining: ${new Date(joiningDate).toLocaleDateString()}</p>` : ''}
    </div>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Your offer letter and further joining details are available in the placement portal.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${FRONTEND_URL}/applications" 
         style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                font-weight: bold; font-size: 16px;">
        View Offer Letter
      </a>
    </div>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
      Congratulations once again on your achievement! 🌟
    </p>
  `;

  return baseTemplate(content);
};

/**
 * Bulk Upload Summary Email Template
 */
const bulkUploadSummaryEmail = (results, superAdminName, superAdminEmail) => {
  const { successful, failed, total } = results;
  const successRate = ((successful.length / total) * 100).toFixed(1);

  let successHTML = '';
  if (successful.length > 0) {
    successHTML = `
      <div style="margin: 20px 0; padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px;">
        <h3 style="color: #155724; margin-top: 0;">✅ Successfully Created (${successful.length})</h3>
        <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 4px; overflow: hidden;">
          <thead>
            <tr style="background-color: #28a745; color: white;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">College Name</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Code</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Admin Username</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Admin Password</th>
            </tr>
          </thead>
          <tbody>
            ${successful.map(item => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; border: 1px solid #ddd;">${item.collegeName}</td>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>${item.collegeCode}</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd; font-family: 'Courier New', monospace; background-color: #f8f9fa;">${item.credentials?.username || 'N/A'}</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-family: 'Courier New', monospace; background-color: #f8f9fa;">${item.credentials?.password || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 15px; color: #856404; background-color: #fff3cd; padding: 12px; border-radius: 5px; border-left: 4px solid #ffc107;">
          <strong>⚠️ Important:</strong> Save these credentials securely. Passwords are shown only once and cannot be retrieved later.
        </div>
      </div>
    `;
  }

  let failedHTML = '';
  if (failed.length > 0) {
    failedHTML = `
      <div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
        <h3 style="color: #721c24; margin-top: 0;">❌ Failed Uploads (${failed.length})</h3>
        <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 4px; overflow: hidden;">
          <thead>
            <tr style="background-color: #dc3545; color: white;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Line</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">College Name</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Errors</th>
            </tr>
          </thead>
          <tbody>
            ${failed.map(item => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${item.line}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.collegeName}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">
                  <ul style="margin: 0; padding-left: 20px; color: #721c24;">
                    ${item.errors.map(error => `<li>${error}</li>`).join('')}
                  </ul>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hello ${superAdminName},</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Your bulk college upload has been completed. Here's a comprehensive summary of the results:
    </p>
    
    <!-- Summary Statistics -->
    <div style="display: flex; gap: 15px; margin: 25px 0; justify-content: space-between;">
      <div style="flex: 1; background-color: #d4edda; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #28a745;">
        <div style="font-size: 36px; font-weight: bold; color: #155724; margin-bottom: 5px;">${successful.length}</div>
        <div style="color: #155724; font-weight: bold; font-size: 14px;">Successful</div>
      </div>
      <div style="flex: 1; background-color: #f8d7da; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #dc3545;">
        <div style="font-size: 36px; font-weight: bold; color: #721c24; margin-bottom: 5px;">${failed.length}</div>
        <div style="color: #721c24; font-weight: bold; font-size: 14px;">Failed</div>
      </div>
      <div style="flex: 1; background-color: #d1ecf1; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #17a2b8;">
        <div style="font-size: 36px; font-weight: bold; color: #0c5460; margin-bottom: 5px;">${total}</div>
        <div style="color: #0c5460; font-weight: bold; font-size: 14px;">Total</div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <span style="color: white; font-size: 18px; font-weight: bold;">Success Rate: ${successRate}%</span>
      <span style="color: #f0f0f0; font-size: 14px; display: block; margin-top: 5px;">${successful.length} out of ${total} colleges created successfully</span>
    </div>

    ${successHTML}
    ${failedHTML}

    <div style="margin-top: 30px; padding: 20px; background-color: #e7f3ff; border-radius: 8px; border-left: 4px solid #2196F3;">
      <h3 style="margin-top: 0; color: #0c5460;">📌 Next Steps:</h3>
      <ul style="line-height: 2; color: #0c5460; margin: 10px 0;">
        ${successful.length > 0 ? '<li><strong>Share admin credentials</strong> with respective college administrators</li>' : ''}
        ${successful.length > 0 ? '<li><strong>Verify login access</strong> for all new college admins</li>' : ''}
        ${failed.length > 0 ? '<li><strong>Review and fix errors</strong> for failed uploads</li>' : ''}
        ${failed.length > 0 ? '<li><strong>Re-upload corrected data</strong> for failed entries</li>' : ''}
        <li><strong>Access Dashboard:</strong> <a href="${FRONTEND_URL}" style="color: #667eea; text-decoration: none; font-weight: bold;">Manage Colleges</a></li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${FRONTEND_URL}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                font-weight: bold; font-size: 16px;">
        Go to Dashboard
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <strong>Note:</strong> This is an automated notification from the College Placement Management System. 
      If you have any questions or need assistance, please contact technical support.
    </p>
  `;

  return baseTemplate(content);
};

module.exports = {
  welcomeEmail,
  invitationEmail,
  passwordResetEmail,
  applicationSubmittedEmail,
  offerLetterEmail,
  bulkUploadSummaryEmail,
  baseTemplate
};
