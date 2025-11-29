require('dotenv').config();
const mongoose = require('mongoose');
const College = require('../models/College');
const User = require('../models/User');

/**
 * Production Admin Creation Script
 * 
 * ⚠️ DEVELOPER USE ONLY - PRODUCTION ENVIRONMENT ⚠️
 * 
 * Use this script to create admin accounts for production.
 * 
 * SECURITY NOTES:
 * - Only run this script with database access (developers only)
 * - Never expose this script to end users
 * - Change default passwords immediately after first login
 * - Keep audit logs of all admin accounts created
 * 
 * Instructions:
 * 1. Modify the college and admin details below
 * 2. Run: node scripts/createProductionAdmin.js
 * 3. Provide the credentials to the admin securely
 * 4. Admin should change password on first login
 */

// ==========================================
// CONFIGURE YOUR COLLEGE AND ADMIN HERE
// ==========================================

const COLLEGE_CONFIG = {
  name: 'Your College Name',              // e.g., 'MIT'
  location: 'City, State',                 // e.g., 'Cambridge, MA'
  code: 'COLLEGE_CODE',                    // e.g., 'MIT' (uppercase)
  status: 'active'
};

const ADMIN_CONFIG = {
  username: 'admin_username',              // e.g., 'admin_mit'
  email: 'admin@college.edu',              // Admin's email
  password: 'ChangeThisPassword123!',      // CHANGE THIS!
  fullName: 'Admin Full Name',             // e.g., 'John Smith'
  role: 'admin',
  status: 'active'
};

// ==========================================
// SCRIPT EXECUTION
// ==========================================

const createProductionAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n✅ Connected to MongoDB');

    // Check if college already exists
    const existingCollege = await College.findOne({ 
      $or: [
        { code: COLLEGE_CONFIG.code },
        { name: COLLEGE_CONFIG.name }
      ]
    });

    if (existingCollege) {
      console.log('\n❌ Error: College already exists!');
      console.log(`   Name: ${existingCollege.name}`);
      console.log(`   Code: ${existingCollege.code}`);
      console.log('\nPlease check your configuration or use a different college.\n');
      process.exit(1);
    }

    // Check if admin username/email already exists
    const existingUser = await User.findOne({
      $or: [
        { username: ADMIN_CONFIG.username },
        { email: ADMIN_CONFIG.email }
      ]
    });

    if (existingUser) {
      console.log('\n❌ Error: Admin user already exists!');
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log('\nPlease use a different username/email.\n');
      process.exit(1);
    }

    // Validate password strength
    if (ADMIN_CONFIG.password === 'ChangeThisPassword123!' || ADMIN_CONFIG.password.length < 8) {
      console.log('\n⚠️  WARNING: You are using a weak or default password!');
      console.log('   Please update ADMIN_CONFIG.password in this script.\n');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('Continue anyway? (yes/no): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Cancelled by user.\n');
        process.exit(0);
      }
    }

    console.log('\n📚 Creating college...');
    
    // Create college
    const college = new College(COLLEGE_CONFIG);
    await college.save();
    console.log(`✅ College created: ${college.name} (${college.code})`);

    console.log('\n👤 Creating admin user...');
    
    // Create admin
    const admin = new User({
      ...ADMIN_CONFIG,
      collegeId: college._id,
      assignedBy: null  // Created by developer
    });
    await admin.save();
    console.log(`✅ Admin created: ${admin.username}`);

    // Link admin to college
    college.adminId = admin._id;
    await college.save();
    console.log(`✅ Admin linked to college`);

    // Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('✅ PRODUCTION ADMIN CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 College Details:');
    console.log(`   Name: ${college.name}`);
    console.log(`   Code: ${college.code}`);
    console.log(`   Location: ${college.location}`);
    console.log(`   ID: ${college._id}`);
    
    console.log('\n👤 Admin Credentials (SECURE THESE!):');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${ADMIN_CONFIG.password}`);
    console.log(`   Role: ${admin.role}`);
    
    console.log('\n⚠️  IMPORTANT SECURITY STEPS:');
    console.log('   1. Share these credentials securely with the admin');
    console.log('   2. Admin should change password on first login');
    console.log('   3. Delete or secure this script file');
    console.log('   4. Document this admin creation in your audit logs');
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Admin logs in at: http://your-domain.com');
    console.log('   2. Admin will be auto-linked to their college');
    console.log('   3. Admin can create moderators and students');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    if (error.errors) {
      Object.values(error.errors).forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }
    console.log('');
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB\n');
  }
};

// Run the script
createProductionAdmin();
