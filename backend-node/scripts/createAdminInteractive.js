require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const College = require('../models/College');
const User = require('../models/User');

/**
 * Interactive Admin Creation Tool
 * 
 * ⚠️ DEVELOPER TOOL - MANUAL COLLEGE & ADMIN CREATION ⚠️
 * 
 * This script allows developers to manually enter:
 * - College details (name, location, code)
 * - Admin details (username, email, full name, password)
 * 
 * The developer provides login credentials which are given to the admin.
 * The admin can then login and assign moderators and students.
 * 
 * Run: npm run create-admin-interactive
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createAdminInteractive = async () => {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('  🔐 DEVELOPER TOOL - CREATE ADMIN ACCOUNT');
    console.log('='.repeat(70));
    console.log('\nThis tool allows you to manually create an admin account.');
    console.log('You will enter college details and admin credentials.\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ==========================================
    // STEP 1: COLLECT COLLEGE INFORMATION
    // ==========================================
    console.log('='.repeat(70));
    console.log('STEP 1: COLLEGE INFORMATION');
    console.log('='.repeat(70) + '\n');

    const collegeName = await question('Enter College Name (e.g., Massachusetts Institute of Technology): ');
    const collegeLocation = await question('Enter College Location (e.g., Cambridge, MA): ');
    const collegeCode = await question('Enter College Code (e.g., MIT) - UPPERCASE: ');

    // Validate college code
    const upperCollegeCode = collegeCode.toUpperCase().trim();
    
    // Check if college already exists
    const existingCollege = await College.findOne({ 
      $or: [
        { code: upperCollegeCode },
        { name: collegeName.trim() }
      ]
    });

    if (existingCollege) {
      console.log('\n❌ ERROR: A college with this name or code already exists!');
      console.log(`   Existing College: ${existingCollege.name} (${existingCollege.code})`);
      console.log('\nPlease use a different name or code.\n');
      rl.close();
      process.exit(1);
    }

    console.log('\n✓ College details collected\n');

    // ==========================================
    // STEP 2: COLLECT ADMIN INFORMATION
    // ==========================================
    console.log('='.repeat(70));
    console.log('STEP 2: ADMIN ACCOUNT INFORMATION');
    console.log('='.repeat(70) + '\n');

    const adminFullName = await question('Enter Admin Full Name (e.g., John Smith): ');
    const adminEmail = await question('Enter Admin Email (e.g., admin@mit.edu): ');
    const adminUsername = await question('Enter Admin Username (e.g., admin_mit): ');
    const adminPassword = await question('Enter Admin Password (min 6 characters): ');

    // Validate password
    if (adminPassword.length < 6) {
      console.log('\n❌ ERROR: Password must be at least 6 characters long.\n');
      rl.close();
      process.exit(1);
    }

    // Check if admin already exists
    const existingUser = await User.findOne({
      $or: [
        { username: adminUsername.toLowerCase().trim() },
        { email: adminEmail.toLowerCase().trim() }
      ]
    });

    if (existingUser) {
      console.log('\n❌ ERROR: A user with this username or email already exists!');
      console.log(`   Existing User: ${existingUser.username} (${existingUser.email})`);
      console.log('\nPlease use a different username or email.\n');
      rl.close();
      process.exit(1);
    }

    console.log('\n✓ Admin details collected\n');

    // ==========================================
    // STEP 3: CONFIRMATION
    // ==========================================
    console.log('='.repeat(70));
    console.log('STEP 3: CONFIRM DETAILS');
    console.log('='.repeat(70) + '\n');

    console.log('📋 COLLEGE DETAILS:');
    console.log(`   Name: ${collegeName}`);
    console.log(`   Location: ${collegeLocation}`);
    console.log(`   Code: ${upperCollegeCode}`);
    
    console.log('\n👤 ADMIN DETAILS:');
    console.log(`   Full Name: ${adminFullName}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${'*'.repeat(adminPassword.length)}`);
    
    console.log('\n');
    const confirm = await question('Is this information correct? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Cancelled by user. Please run the script again.\n');
      rl.close();
      process.exit(0);
    }

    // ==========================================
    // STEP 4: CREATE COLLEGE AND ADMIN
    // ==========================================
    console.log('\n' + '='.repeat(70));
    console.log('STEP 4: CREATING ACCOUNTS');
    console.log('='.repeat(70) + '\n');

    console.log('⏳ Creating college...');
    const college = new College({
      name: collegeName.trim(),
      location: collegeLocation.trim(),
      code: upperCollegeCode,
      status: 'active'
    });
    await college.save();
    console.log('✅ College created successfully');

    console.log('\n⏳ Creating admin account...');
    const admin = new User({
      username: adminUsername.toLowerCase().trim(),
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,  // Will be hashed automatically
      fullName: adminFullName.trim(),
      role: 'admin',
      collegeId: college._id,
      assignedBy: null,  // Created by developer
      status: 'active'
    });
    await admin.save();
    console.log('✅ Admin account created successfully');

    console.log('\n⏳ Linking admin to college...');
    college.adminId = admin._id;
    await college.save();
    console.log('✅ Admin linked to college');

    // ==========================================
    // STEP 5: DISPLAY CREDENTIALS
    // ==========================================
    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESS! ADMIN ACCOUNT CREATED');
    console.log('='.repeat(70) + '\n');

    console.log('📋 COLLEGE INFORMATION:');
    console.log(`   Name: ${college.name}`);
    console.log(`   Code: ${college.code}`);
    console.log(`   Location: ${college.location}`);
    console.log(`   College ID: ${college._id}`);

    console.log('\n🔑 ADMIN LOGIN CREDENTIALS:');
    console.log('   ┌─────────────────────────────────────────────────────────');
    console.log(`   │ Username: ${admin.username}`);
    console.log(`   │ Password: ${adminPassword}`);
    console.log(`   │ Email:    ${admin.email}`);
    console.log('   └─────────────────────────────────────────────────────────');

    console.log('\n⚠️  IMPORTANT INSTRUCTIONS:');
    console.log('   1. ✅ Share these credentials SECURELY with the admin');
    console.log('   2. ✅ Admin should change password after first login');
    console.log('   3. ✅ Store these credentials in a secure location');
    console.log('   4. ✅ Admin can now login at your application URL');

    console.log('\n💡 WHAT ADMIN CAN DO:');
    console.log(`   • Login with username: ${admin.username}`);
    console.log(`   • Automatically linked to: ${college.name}`);
    console.log('   • Create moderators for their college');
    console.log('   • Create students for their college');
    console.log('   • Post jobs for their college');
    console.log('   • Manage users in their college');

    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Give login credentials to the admin');
    console.log('   3. Admin logs in (no college selection needed)');
    console.log('   4. Admin creates moderators and students\n');

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.errors) {
      console.error('\nValidation Errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }
    console.log('');
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB\n');
  }
};

// Run the interactive script
createAdminInteractive();
