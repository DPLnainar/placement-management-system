require('dotenv').config();
const mongoose = require('mongoose');
const College = require('../models/College');
const User = require('../models/User');

/**
 * Seed Script to Create Initial Admin Users
 * 
 * ⚠️ DEVELOPER USE ONLY ⚠️
 * 
 * CRITICAL SECURITY FEATURE:
 * This is the ONLY way to create admin accounts in the system.
 * There is NO public registration or signup functionality.
 * 
 * This script demonstrates how developers manually assign admins to colleges.
 * 
 * Security Model:
 * - Only developers (with database access) can create admins
 * - No self-registration allowed
 * - Admins must be explicitly created and assigned to colleges by developers
 * - This prevents unauthorized admin account creation
 * 
 * Process:
 * 1. Developer creates a college in the database
 * 2. Developer creates an admin user and assigns them to the college
 * 3. Developer provides login credentials to the admin
 * 4. Admin logs in (auto-linked to their assigned college)
 * 5. Admin can then create moderators and students for their college
 * 
 * After this, the admin can:
 * - Login without selecting a college (auto-linked to their assigned college)
 * - Create moderators and students for their college
 * - Manage users within their college
 * 
 * Run this script: npm run seed
 */

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Clear existing data (for demo purposes only - remove in production!)
    console.log('\n⚠️  Clearing existing users and colleges...');
    await User.deleteMany({});
    await College.deleteMany({});
    console.log('✅ Data cleared');

    // ==========================================
    // STEP 1: Create Colleges
    // ==========================================
    console.log('\n📚 Creating colleges...');

    const college1 = new College({
      name: 'Tech University',
      location: 'New York, NY',
      code: 'TU',
      status: 'active'
    });
    await college1.save();
    console.log(`✅ Created college: ${college1.name} (${college1.code})`);

    const college2 = new College({
      name: 'State Engineering College',
      location: 'Boston, MA',
      code: 'SEC',
      status: 'active'
    });
    await college2.save();
    console.log(`✅ Created college: ${college2.name} (${college2.code})`);

    // ==========================================
    // STEP 2: Create Admin Users
    // ==========================================
    console.log('\n👤 Creating admin users...');

    const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'ChangeMe123!';

    // Admin for Tech University
    const admin1 = new User({
      username: 'admin_tu',
      email: 'admin@techuni.edu',
      password: DEFAULT_PASSWORD,  // Will be hashed automatically
      fullName: 'John Admin',
      role: 'admin',
      collegeId: college1._id,  // CRITICAL: Assign admin to college
      assignedBy: null,  // Admins are not assigned by anyone (manual creation)
      status: 'active'
    });
    await admin1.save();
    console.log(`✅ Created admin: ${admin1.username} for ${college1.name}`);

    // Admin for State Engineering College
    const admin2 = new User({
      username: 'admin_sec',
      email: 'admin@stateeng.edu',
      password: DEFAULT_PASSWORD,
      fullName: 'Jane Admin',
      role: 'admin',
      collegeId: college2._id,  // CRITICAL: Assign admin to college
      assignedBy: null,
      status: 'active'
    });
    await admin2.save();
    console.log(`✅ Created admin: ${admin2.username} for ${college2.name}`);

    // ==========================================
    // STEP 3: Update Colleges with Admin IDs
    // ==========================================
    console.log('\n🔗 Linking admins to colleges...');

    college1.adminId = admin1._id;
    await college1.save();
    console.log(`✅ Linked ${admin1.username} to ${college1.name}`);

    college2.adminId = admin2._id;
    await college2.save();
    console.log(`✅ Linked ${admin2.username} to ${college2.name}`);

    // ==========================================
    // STEP 4: Create Sample Moderators and Students
    // (Normally done by admin via API, but included here for demo)
    // ==========================================
    console.log('\n👥 Creating sample moderators and students...');

    // Moderator for Tech University
    const moderator1 = new User({
      username: 'mod_tu',
      email: 'moderator@techuni.edu',
      password: DEFAULT_PASSWORD,
      fullName: 'Bob Moderator',
      role: 'moderator',
      collegeId: college1._id,
      assignedBy: admin1._id,  // Assigned by admin1
      status: 'active'
    });
    await moderator1.save();
    console.log(`✅ Created moderator: ${moderator1.username} for ${college1.name}`);

    // Students for Tech University
    const student1 = new User({
      username: 'student1_tu',
      email: 'student1@techuni.edu',
      password: DEFAULT_PASSWORD,
      fullName: 'Alice Student',
      role: 'student',
      collegeId: college1._id,
      assignedBy: admin1._id,
      status: 'active'
    });
    await student1.save();
    console.log(`✅ Created student: ${student1.username} for ${college1.name}`);

    const student2 = new User({
      username: 'student2_tu',
      email: 'student2@techuni.edu',
      password: DEFAULT_PASSWORD,
      fullName: 'Charlie Student',
      role: 'student',
      collegeId: college1._id,
      assignedBy: admin1._id,
      status: 'active'
    });
    await student2.save();
    console.log(`✅ Created student: ${student2.username} for ${college1.name}`);

    // Moderator for State Engineering College
    const moderator2 = new User({
      username: 'mod_sec',
      email: 'moderator@stateeng.edu',
      password: DEFAULT_PASSWORD,
      fullName: 'David Moderator',
      role: 'moderator',
      collegeId: college2._id,
      assignedBy: admin2._id,
      status: 'active'
    });
    await moderator2.save();
    console.log(`✅ Created moderator: ${moderator2.username} for ${college2.name}`);

    // Students for State Engineering College
    const student3 = new User({
      username: 'student1_sec',
      email: 'student1@stateeng.edu',
      password: DEFAULT_PASSWORD,
      fullName: 'Emma Student',
      role: 'student',
      collegeId: college2._id,
      assignedBy: admin2._id,
      status: 'active'
    });
    await student3.save();
    console.log(`✅ Created student: ${student3.username} for ${college2.name}`);

    // ==========================================
    // Summary
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - ${await College.countDocuments()} colleges created`);
    console.log(`   - ${await User.countDocuments({ role: 'admin' })} admins created`);
    console.log(`   - ${await User.countDocuments({ role: 'moderator' })} moderators created`);
    console.log(`   - ${await User.countDocuments({ role: 'student' })} students created`);

    console.log('\n🔑 Test Credentials:');
    console.log('   (Note: Passwords below are the DEFAULT. If you set SEED_DEFAULT_PASSWORD env var, use that instead.)');
    console.log('\n   Tech University (TU):');
    console.log(`   ├─ Admin:     username: admin_tu     | password: ${DEFAULT_PASSWORD}`);
    console.log(`   ├─ Moderator: username: mod_tu       | password: ${DEFAULT_PASSWORD}`);
    console.log(`   ├─ Student:   username: student1_tu  | password: ${DEFAULT_PASSWORD}`);
    console.log(`   └─ Student:   username: student2_tu  | password: ${DEFAULT_PASSWORD}`);

    console.log('\n   State Engineering College (SEC):');
    console.log(`   ├─ Admin:     username: admin_sec    | password: ${DEFAULT_PASSWORD}`);
    console.log(`   ├─ Moderator: username: mod_sec      | password: ${DEFAULT_PASSWORD}`);
    console.log(`   └─ Student:   username: student1_sec | password: ${DEFAULT_PASSWORD}`);

    console.log('\n💡 Key Points:');
    console.log('   - Users do NOT select college during login');
    console.log('   - Each user is pre-assigned to their college');
    console.log('   - Admins can only manage users in their own college');
    console.log('   - Login auto-links users to their assigned college');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Test login endpoint: POST /api/auth/login');
    console.log('   3. Admin creates new users: POST /api/users');
    console.log('\n');

  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedData();
