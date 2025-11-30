require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createSuperAdmin = async () => {
  try {
    console.log('\n🔧 Creating SuperAdmin...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('\n⚠️  SuperAdmin already exists:');
      console.log(`   Username: ${existingSuperAdmin.username}`);
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log('\n✅ You can login with existing SuperAdmin credentials.\n');
      process.exit(0);
    }

    // Create SuperAdmin
    const superAdmin = new User({
      username: 'superadmin',
      email: 'superadmin@system.com',
      password: 'SuperAdmin123!',
      fullName: 'Super Administrator',
      role: 'superadmin',
      collegeId: null,
      assignedBy: null,
      status: 'active',
      isApproved: true
    });

    await superAdmin.save();

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUPERADMIN CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('   ┌────────────────────────────────────────────');
    console.log('   │ Username: superadmin');
    console.log('   │ Password: SuperAdmin123!');
    console.log('   │ Role:     SuperAdmin (ALL COLLEGES ACCESS)');
    console.log('   └────────────────────────────────────────────');
    console.log('\n💡 Next Steps:');
    console.log('   1. Login at http://localhost:3000');
    console.log('   2. Create colleges and assign admins');
    console.log('   3. Change your password after first login\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
