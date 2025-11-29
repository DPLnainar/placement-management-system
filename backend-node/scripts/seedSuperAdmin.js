require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const College = require('../models/College');
const User = require('../models/User');

/**
 * SUPER ADMIN SEED SCRIPT
 * 
 * ⚠️⚠️⚠️ CRITICAL SECURITY - MASTER KEY PROTECTED ⚠️⚠️⚠️
 * 
 * This script allows the DEVELOPER (Super Admin) to:
 * 1. Create a SuperAdmin account (highest privilege - can see ALL colleges)
 * 2. Create a College and assign a College Admin
 * 
 * MASTER KEY: Set in .env file as MASTER_KEY
 * 
 * Architecture:
 * - SuperAdmin: Can create colleges, assign admins, view all data
 * - College Admin: Can create moderators/students for THEIR college only
 * - Data Isolation: College Admins can NEVER see other colleges' data
 * 
 * Run: npm run seed-superadmin
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const seedSuperAdmin = async () => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('  🔐 SUPER ADMIN MANAGEMENT TOOL');
    console.log('='.repeat(80));
    console.log('\n⚠️  DEVELOPER ONLY - MASTER KEY REQUIRED\n');

    // ==========================================
    // STEP 1: VERIFY MASTER KEY
    // ==========================================
    const masterKey = await question('Enter Master Key: ');
    
    if (!process.env.MASTER_KEY) {
      console.log('\n❌ ERROR: MASTER_KEY not set in .env file!');
      console.log('   Add: MASTER_KEY=your-secret-master-key\n');
      rl.close();
      process.exit(1);
    }

    if (masterKey !== process.env.MASTER_KEY) {
      console.log('\n❌ AUTHENTICATION FAILED: Invalid Master Key\n');
      rl.close();
      process.exit(1);
    }

    console.log('✅ Master Key Verified\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ==========================================
    // STEP 2: CHOOSE OPERATION
    // ==========================================
    console.log('='.repeat(80));
    console.log('SELECT OPERATION:');
    console.log('='.repeat(80));
    console.log('1. Create SuperAdmin Account (Highest Privilege)');
    console.log('2. Create College + College Admin');
    console.log('3. Exit\n');

    const choice = await question('Enter choice (1, 2, or 3): ');

    if (choice === '3') {
      console.log('\n👋 Exiting...\n');
      rl.close();
      process.exit(0);
    }

    // ==========================================
    // OPTION 1: CREATE SUPERADMIN
    // ==========================================
    if (choice === '1') {
      console.log('\n' + '='.repeat(80));
      console.log('CREATE SUPERADMIN ACCOUNT');
      console.log('='.repeat(80));
      console.log('\n⚠️  SuperAdmin can:');
      console.log('   • View data from ALL colleges');
      console.log('   • Create new colleges');
      console.log('   • Assign College Admins');
      console.log('   • Override any data\n');

      const username = await question('SuperAdmin Username: ');
      const email = await question('SuperAdmin Email: ');
      const fullName = await question('SuperAdmin Full Name: ');
      const password = await question('SuperAdmin Password (min 6 chars): ');

      if (password.length < 6) {
        console.log('\n❌ ERROR: Password must be at least 6 characters\n');
        rl.close();
        process.exit(1);
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
      });

      if (existingUser) {
        console.log('\n❌ ERROR: User with this username or email already exists\n');
        rl.close();
        process.exit(1);
      }

      // Create SuperAdmin
      const superAdmin = new User({
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password: password,
        fullName: fullName.trim(),
        role: 'superadmin',
        collegeId: null,  // SuperAdmin not tied to any college
        assignedBy: null,
        status: 'active'
      });

      await superAdmin.save();

      console.log('\n' + '='.repeat(80));
      console.log('✅ SUPERADMIN CREATED SUCCESSFULLY');
      console.log('='.repeat(80));
      console.log('\n🔑 LOGIN CREDENTIALS:');
      console.log('   ┌────────────────────────────────────────────────');
      console.log(`   │ Username: ${superAdmin.username}`);
      console.log(`   │ Password: ${password}`);
      console.log(`   │ Role:     SuperAdmin (ALL COLLEGES ACCESS)`);
      console.log('   └────────────────────────────────────────────────\n');
    }

    // ==========================================
    // OPTION 2: CREATE COLLEGE + ADMIN
    // ==========================================
    if (choice === '2') {
      console.log('\n' + '='.repeat(80));
      console.log('CREATE COLLEGE + COLLEGE ADMIN');
      console.log('='.repeat(80) + '\n');

      // College Details
      console.log('📋 COLLEGE INFORMATION:\n');
      const collegeName = await question('College Name: ');
      const collegeLocation = await question('College Location: ');
      const collegeCode = await question('College Code (UPPERCASE): ');
      const subscriptionStatus = await question('Subscription Status (active/trial/expired) [active]: ') || 'active';

      // Check if college exists
      const existingCollege = await College.findOne({
        $or: [
          { code: collegeCode.toUpperCase() },
          { name: collegeName.trim() }
        ]
      });

      if (existingCollege) {
        console.log('\n❌ ERROR: College with this name or code already exists\n');
        rl.close();
        process.exit(1);
      }

      // Admin Details
      console.log('\n👤 COLLEGE ADMIN INFORMATION:\n');
      const adminUsername = await question('Admin Username: ');
      const adminEmail = await question('Admin Email: ');
      const adminFullName = await question('Admin Full Name: ');
      const adminPassword = await question('Admin Password (min 6 chars): ');

      if (adminPassword.length < 6) {
        console.log('\n❌ ERROR: Password must be at least 6 characters\n');
        rl.close();
        process.exit(1);
      }

      // Check if admin exists
      const existingAdmin = await User.findOne({
        $or: [
          { username: adminUsername.toLowerCase() },
          { email: adminEmail.toLowerCase() }
        ]
      });

      if (existingAdmin) {
        console.log('\n❌ ERROR: User with this username or email already exists\n');
        rl.close();
        process.exit(1);
      }

      // Confirmation
      console.log('\n' + '='.repeat(80));
      console.log('CONFIRM DETAILS:');
      console.log('='.repeat(80));
      console.log(`\n📋 College: ${collegeName} (${collegeCode.toUpperCase()})`);
      console.log(`   Location: ${collegeLocation}`);
      console.log(`   Subscription: ${subscriptionStatus}`);
      console.log(`\n👤 Admin: ${adminFullName}`);
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Email: ${adminEmail}\n`);

      const confirm = await question('Create this college and admin? (yes/y): ');
      
      if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('\n❌ Cancelled\n');
        rl.close();
        process.exit(0);
      }

      // Create College
      console.log('\n⏳ Creating college...');
      const college = new College({
        name: collegeName.trim(),
        location: collegeLocation.trim(),
        code: collegeCode.toUpperCase().trim(),
        subscriptionStatus: subscriptionStatus,
        status: 'active'
      });
      await college.save();
      console.log('✅ College created');

      // Create Admin
      console.log('⏳ Creating admin...');
      const admin = new User({
        username: adminUsername.toLowerCase().trim(),
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword,
        fullName: adminFullName.trim(),
        role: 'admin',
        collegeId: college._id,
        assignedBy: null,  // Assigned by SuperAdmin/Developer
        status: 'active'
      });
      await admin.save();
      console.log('✅ Admin created');

      // Link Admin to College
      console.log('⏳ Linking admin to college...');
      college.adminId = admin._id;
      await college.save();
      console.log('✅ Admin linked to college');

      console.log('\n' + '='.repeat(80));
      console.log('✅ SUCCESS - COLLEGE & ADMIN CREATED');
      console.log('='.repeat(80));
      console.log('\n📋 COLLEGE DETAILS:');
      console.log(`   Name: ${college.name}`);
      console.log(`   Code: ${college.code}`);
      console.log(`   ID: ${college._id}`);
      console.log(`   Subscription: ${college.subscriptionStatus}`);
      console.log('\n🔑 ADMIN LOGIN CREDENTIALS:');
      console.log('   ┌────────────────────────────────────────────────');
      console.log(`   │ Username: ${admin.username}`);
      console.log(`   │ Password: ${adminPassword}`);
      console.log(`   │ College:  ${college.name}`);
      console.log(`   │ Role:     College Admin (${college.code} ONLY)`);
      console.log('   └────────────────────────────────────────────────');
      console.log('\n💡 Admin Can:');
      console.log(`   • View ONLY ${college.name} data`);
      console.log('   • Create moderators for their college');
      console.log('   • Create students for their college');
      console.log('   • Post jobs for their college');
      console.log('   • CANNOT access other colleges data\n');
    }

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('');
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB\n');
  }
};

seedSuperAdmin();
