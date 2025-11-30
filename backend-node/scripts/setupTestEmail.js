require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Create a test email account using Ethereal
 * This is perfect for testing without a real email account
 */
async function setupTestEmail() {
  try {
    console.log('🔧 Creating test email account...\n');
    
    // Create a test account
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Test email account created!\n');
    console.log('📧 SMTP Configuration:');
    console.log('━'.repeat(60));
    console.log(`EMAIL_HOST=smtp.ethereal.email`);
    console.log(`EMAIL_PORT=587`);
    console.log(`EMAIL_SECURE=false`);
    console.log(`EMAIL_USER=${testAccount.user}`);
    console.log(`EMAIL_PASSWORD=${testAccount.pass}`);
    console.log(`EMAIL_FROM=noreply@placementportal.com`);
    console.log(`EMAIL_FROM_NAME=Placement Portal`);
    console.log(`ENABLE_EMAIL=true`);
    console.log('━'.repeat(60));
    
    console.log('\n📝 Add these to your .env file!\n');
    
    // Test sending an email
    console.log('📨 Sending test email...\n');
    
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    const info = await transporter.sendMail({
      from: '"Placement Portal" <noreply@placementportal.com>',
      to: testAccount.user,
      subject: '✅ Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">🎉 Email System is Working!</h2>
          <p>Congratulations! Your email notification system has been configured successfully.</p>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;">
              <strong>✅ Test Successful:</strong> The placement portal can now send emails.
            </p>
          </div>
          <p>You can now use features like:</p>
          <ul>
            <li>Password reset emails</li>
            <li>Student invitation emails</li>
            <li>Job posting notifications</li>
            <li>Application status updates</li>
          </ul>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log('\n💡 Click the preview URL above to see the email!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupTestEmail();
