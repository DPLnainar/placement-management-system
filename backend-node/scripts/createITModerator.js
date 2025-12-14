require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const College = require('../models/College');

/**
 * Create IT Moderator for Phase 3 Testing
 * Needed to verify IT department students (teststudent3)
 */

const createITModerator = async () => {
    try {
        console.log('\n👨‍🏫 Creating IT Moderator...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find Test Engineering College
        const testCollege = await College.findOne({ code: 'TEC' });
        if (!testCollege) {
            console.log('❌ Test Engineering College not found. Please run setupPhase2TestData.js first.');
            process.exit(1);
        }

        // Find admin for assignedBy
        const admin = await User.findOne({ username: 'testadmin' });

        // Check if IT moderator already exists
        let itModerator = await User.findOne({ username: 'testmodit' });

        if (!itModerator) {
            itModerator = new User({
                username: 'testmodit',
                email: 'testmodit@testcollege.edu',
                password: 'TestMod123!',
                fullName: 'Test IT Moderator',
                role: 'moderator',
                collegeId: testCollege._id,
                department: 'Information Technology',
                assignedBy: admin?._id,
                status: 'active',
                isApproved: true
            });
            await itModerator.save();
            console.log('✅ IT Moderator created successfully\n');
        } else {
            console.log('ℹ️  IT Moderator already exists\n');
        }

        // Print Summary
        console.log('='.repeat(70));
        console.log('✅ IT MODERATOR READY');
        console.log('='.repeat(70));
        console.log('\n👨‍🏫 MODERATOR ACCOUNTS:\n');

        console.log('1. CS Moderator:');
        console.log('   Username: testmod');
        console.log('   Password: TestMod123!');
        console.log('   Department: Computer Science');
        console.log('   Can verify: teststudent1 (CS)\n');

        console.log('2. IT Moderator:');
        console.log('   Username: testmodit');
        console.log('   Password: TestMod123!');
        console.log('   Department: Information Technology');
        console.log('   Can verify: teststudent3 (IT)\n');

        console.log('🧪 COMPLETE VERIFICATION TESTING:');
        console.log('   1. Login as testmod → Verify teststudent1');
        console.log('   2. Login as testmodit → Verify teststudent3\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

createITModerator();
