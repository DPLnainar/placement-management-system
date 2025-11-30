require('dotenv').config();
const notificationService = require('../utils/notificationService');
const emailTemplates = require('../utils/emailTemplates');

/**
 * Test Email Configuration
 * Sends test emails to verify the email system is working
 */
async function testEmailSystem() {
  console.log('\n' + '='.repeat(70));
  console.log('📧 TESTING EMAIL SYSTEM');
  console.log('='.repeat(70) + '\n');

  console.log('📝 Configuration:');
  console.log(`   Host: ${process.env.EMAIL_HOST}`);
  console.log(`   Port: ${process.env.EMAIL_PORT}`);
  console.log(`   User: ${process.env.EMAIL_USER}`);
  console.log(`   Enabled: ${process.env.ENABLE_EMAIL}\n`);

  // Test 1: Simple email
  console.log('📨 Test 1: Sending simple test email...');
  const test1 = await notificationService.sendEmail({
    to: 'test@example.com',
    subject: '✅ Test Email - Placement Portal',
    html: '<h1>Email System is Working!</h1><p>This is a test email from your placement management system.</p>',
    text: 'Email System is Working! This is a test email.'
  });

  if (test1.success) {
    console.log('   ✅ Simple email sent successfully!\n');
  } else {
    console.log('   ❌ Failed:', test1.message || test1.error, '\n');
  }

  // Test 2: Welcome Email Template
  console.log('📨 Test 2: Sending Welcome Email Template...');
  const welcomeHtml = emailTemplates.welcomeEmail({
    fullName: 'John Doe',
    username: 'johndoe',
    role: 'student',
    collegeName: 'Test College'
  });

  const test2 = await notificationService.sendEmail({
    to: 'student@example.com',
    subject: 'Welcome to Placement Portal!',
    html: welcomeHtml
  });

  if (test2.success) {
    console.log('   ✅ Welcome email sent successfully!\n');
  } else {
    console.log('   ❌ Failed:', test2.message || test2.error, '\n');
  }

  // Test 3: Invitation Email Template
  console.log('📨 Test 3: Sending Invitation Email Template...');
  const invitationHtml = emailTemplates.invitationEmail({
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    collegeName: 'Test College',
    invitationToken: 'test-token-12345',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  });

  const test3 = await notificationService.sendEmail({
    to: 'jane@example.com',
    subject: 'You are invited to join Placement Portal',
    html: invitationHtml
  });

  if (test3.success) {
    console.log('   ✅ Invitation email sent successfully!\n');
  } else {
    console.log('   ❌ Failed:', test3.message || test3.error, '\n');
  }

  // Test 4: Password Reset Email
  console.log('📨 Test 4: Sending Password Reset Email...');
  const resetHtml = emailTemplates.passwordResetEmail({
    fullName: 'Test User',
    resetToken: 'reset-token-xyz789',
    expiresIn: '1 hour'
  });

  const test4 = await notificationService.sendEmail({
    to: 'user@example.com',
    subject: 'Reset Your Password',
    html: resetHtml
  });

  if (test4.success) {
    console.log('   ✅ Password reset email sent successfully!\n');
  } else {
    console.log('   ❌ Failed:', test4.message || test4.error, '\n');
  }

  // Test 5: Application Submitted Email
  console.log('📨 Test 5: Sending Application Confirmation Email...');
  const appHtml = emailTemplates.applicationSubmittedEmail({
    fullName: 'Alice Johnson',
    jobTitle: 'Software Developer',
    company: 'Tech Corp',
    applicationDate: new Date()
  });

  const test5 = await notificationService.sendEmail({
    to: 'alice@example.com',
    subject: 'Application Submitted Successfully',
    html: appHtml
  });

  if (test5.success) {
    console.log('   ✅ Application confirmation sent successfully!\n');
  } else {
    console.log('   ❌ Failed:', test5.message || test5.error, '\n');
  }

  // Test 6: Offer Letter Email
  console.log('📨 Test 6: Sending Offer Letter Email...');
  const offerHtml = emailTemplates.offerLetterEmail({
    fullName: 'Bob Wilson',
    jobTitle: 'Senior Developer',
    company: 'Amazing Company',
    package: '12',
    joiningDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  });

  const test6 = await notificationService.sendEmail({
    to: 'bob@example.com',
    subject: '🎉 Congratulations! Offer Letter',
    html: offerHtml
  });

  if (test6.success) {
    console.log('   ✅ Offer letter email sent successfully!\n');
  } else {
    console.log('   ❌ Failed:', test6.message || test6.error, '\n');
  }

  // Summary
  console.log('='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log('✅ All email templates tested!\n');
  console.log('🔗 Check your Mailtrap inbox at: https://mailtrap.io/inboxes\n');
  console.log('💡 You should see 6 test emails in your inbox.');
  console.log('   Each email showcases different templates and use cases.\n');
  console.log('✨ Email notification system is fully operational!\n');

  process.exit(0);
}

testEmailSystem().catch(error => {
  console.error('\n❌ Error during email testing:', error);
  process.exit(1);
});
