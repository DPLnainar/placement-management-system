const nodemailer = require('nodemailer');

/**
 * Notification Service
 * Handles email and in-app notifications for the placement system
 */

class NotificationService {
  constructor() {
    // Email transporter configuration
    this.emailTransporter = null;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.emailTransporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  }

  /**
   * Send email notification
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.emailTransporter) {
      console.warn('Email not configured. Skipping email notification.');
      return { success: false, message: 'Email not configured' };
    }

    try {
      const mailOptions = {
        from: `"Placement Portal" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text
      };

      const info = await this.emailTransporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify student about new job posting
   */
  async notifyNewJobPosting(student, job) {
    const subject = `New Job Posting: ${job.company} - ${job.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Job Opportunity</h2>
        <p>Hello ${student.fullName},</p>
        <p>A new job opportunity has been posted that matches your profile:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">${job.title}</h3>
          <p style="margin: 10px 0;"><strong>Company:</strong> ${job.company}</p>
          <p style="margin: 10px 0;"><strong>Location:</strong> ${job.location}</p>
          ${job.packageDetails?.ctc ? `<p style="margin: 10px 0;"><strong>CTC:</strong> ${job.packageDetails.ctc} LPA</p>` : ''}
          <p style="margin: 10px 0;"><strong>Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
        </div>
        
        <p>Log in to the placement portal to view full details and apply.</p>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${job._id}" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Job Details
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated notification from your college placement portal.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: student.email,
      subject,
      html,
      text: `New job posted: ${job.company} - ${job.title}. Deadline: ${job.deadline}`
    });
  }

  /**
   * Notify student about application status change
   */
  async notifyApplicationStatus(student, job, application) {
    const statusMessages = {
      shortlisted: 'Congratulations! You have been shortlisted',
      aptitude_scheduled: 'Aptitude test has been scheduled',
      technical_scheduled: 'Technical interview has been scheduled',
      hr_scheduled: 'HR interview has been scheduled',
      selected: '🎉 Congratulations! You have been selected',
      offered: '🎉 Offer letter has been released',
      rejected: 'Application status update'
    };

    const subject = `${statusMessages[application.status] || 'Application Update'} - ${job.company}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Application Status Update</h2>
        <p>Hello ${student.fullName},</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${job.title} at ${job.company}</h3>
          <p style="font-size: 18px; color: #059669; font-weight: bold;">
            Status: ${this.formatStatus(application.status)}
          </p>
          ${application.reviewNotes ? `<p><strong>Note:</strong> ${application.reviewNotes}</p>` : ''}
        </div>
        
        <p>Please check the placement portal for more details and next steps.</p>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/applications" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Application
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Best of luck with your placement journey!
        </p>
      </div>
    `;

    return this.sendEmail({
      to: student.email,
      subject,
      html,
      text: `Application status update for ${job.company} - ${job.title}: ${application.status}`
    });
  }

  /**
   * Notify about interview schedule
   */
  async notifyInterviewSchedule(student, job, round) {
    const subject = `Interview Scheduled: ${job.company} - ${round.roundName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Interview Scheduled</h2>
        <p>Hello ${student.fullName},</p>
        <p>Your interview has been scheduled for <strong>${job.company}</strong>:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${round.roundName}</h3>
          <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${new Date(round.scheduledDate).toLocaleString()}</p>
          <p style="margin: 10px 0;"><strong>Type:</strong> ${round.roundType}</p>
          ${round.notes ? `<p style="margin: 10px 0;"><strong>Instructions:</strong> ${round.notes}</p>` : ''}
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚠️ Important:</strong> Please arrive 15 minutes before the scheduled time. 
            Bring your ID card and any required documents.
          </p>
        </div>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/applications" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Details
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Good luck with your interview!
        </p>
      </div>
    `;

    return this.sendEmail({
      to: student.email,
      subject,
      html,
      text: `Interview scheduled: ${round.roundName} on ${round.scheduledDate}`
    });
  }

  /**
   * Notify about placement drive announcement
   */
  async notifyDriveAnnouncement(student, drive, announcement) {
    const subject = `${announcement.priority === 'urgent' ? '🚨 URGENT: ' : ''}${announcement.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Placement Drive Announcement</h2>
        <p>Hello ${student.fullName},</p>
        
        <div style="background: ${announcement.priority === 'urgent' ? '#fee2e2' : '#f3f4f6'}; 
                    padding: 20px; border-radius: 8px; margin: 20px 0;
                    border-left: 4px solid ${announcement.priority === 'urgent' ? '#dc2626' : '#4F46E5'};">
          <h3 style="margin-top: 0;">${announcement.title}</h3>
          <p style="white-space: pre-wrap;">${announcement.message}</p>
        </div>
        
        <p><strong>Drive:</strong> ${drive.name} (${drive.academicYear})</p>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/placement-drives/${drive._id}" 
           style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Drive Details
        </a>
      </div>
    `;

    return this.sendEmail({
      to: student.email,
      subject,
      html,
      text: `${announcement.title}\n\n${announcement.message}`
    });
  }

  /**
   * Send bulk notifications to multiple students
   */
  async sendBulkNotifications(students, notificationFn, ...args) {
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const student of students) {
      try {
        const result = await notificationFn(student, ...args);
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ student: student.email, error: result.message });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ student: student.email, error: error.message });
      }
    }

    return results;
  }

  /**
   * Helper: Format status for display
   */
  formatStatus(status) {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Export singleton instance
module.exports = new NotificationService();
