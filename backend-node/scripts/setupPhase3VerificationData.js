require('dotenv').config();
const mongoose = require('mongoose');
const StudentData = require('../models/StudentData');
const User = require('../models/User');

/**
 * Phase 3: Setup Verification Test Data
 * Updates student profiles to have PENDING verification status for testing
 */

const setupPhase3VerificationData = async () => {
    try {
        console.log('\n🔍 Setting up Phase 3 Verification Test Data...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find test students
        const student1 = await User.findOne({ username: 'teststudent1' });
        const student2 = await User.findOne({ username: 'teststudent2' });
        const student3 = await User.findOne({ username: 'teststudent3' });

        if (!student1 || !student2 || !student3) {
            console.log('❌ Test students not found. Please run setupPhase2TestData.js first.');
            process.exit(1);
        }

        console.log('📝 Updating student verification statuses...\n');

        // Update Student 1 - Set to PENDING for verification
        let studentData1 = await StudentData.findOne({ userId: student1._id });
        if (studentData1) {
            studentData1.verificationStatus = 'PENDING';
            studentData1.lastVerificationRequest = new Date();
            studentData1.verificationTriggers = ['Profile update', 'Document upload'];
            studentData1.documentsVerified = false;
            await studentData1.save();
            console.log('✅ Student 1 (teststudent1) - Set to PENDING verification');
        }

        // Update Student 2 - Keep as VERIFIED (already verified)
        let studentData2 = await StudentData.findOne({ userId: student2._id });
        if (studentData2) {
            studentData2.verificationStatus = 'VERIFIED';
            studentData2.documentsVerified = true;
            studentData2.verificationDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
            await studentData2.save();
            console.log('✅ Student 2 (teststudent2) - Already VERIFIED');
        }

        // Update Student 3 - Set to PENDING for verification
        let studentData3 = await StudentData.findOne({ userId: student3._id });
        if (studentData3) {
            studentData3.verificationStatus = 'PENDING';
            studentData3.lastVerificationRequest = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
            studentData3.verificationTriggers = ['Initial profile submission'];
            studentData3.documentsVerified = false;
            await studentData3.save();
            console.log('✅ Student 3 (teststudent3) - Set to PENDING verification');
        }

        // Print Summary
        console.log('\n' + '='.repeat(70));
        console.log('✅ PHASE 3 VERIFICATION TEST DATA SETUP COMPLETE');
        console.log('='.repeat(70));
        console.log('\n📋 VERIFICATION QUEUE STATUS:\n');

        console.log('🔍 PENDING VERIFICATION (2 students):');
        console.log('   1. teststudent1 (CS) - Just submitted');
        console.log('   2. teststudent3 (IT) - Submitted 2 hours ago\n');

        console.log('✅ ALREADY VERIFIED (1 student):');
        console.log('   1. teststudent2 (CS) - Verified 7 days ago\n');

        console.log('👨‍🏫 MODERATOR ACCOUNT:');
        console.log('   Username: testmod');
        console.log('   Password: TestMod123!');
        console.log('   Department: Computer Science');
        console.log('   Can verify: teststudent1 (CS dept)\n');

        console.log('⚠️  NOTE:');
        console.log('   - testmod can only see CS students (teststudent1)');
        console.log('   - teststudent3 (IT dept) needs an IT moderator\n');

        console.log('🧪 TESTING WORKFLOW:');
        console.log('   1. Login as moderator (testmod)');
        console.log('   2. Navigate to Verification Queue');
        console.log('   3. Should see 1 pending verification (teststudent1)');
        console.log('   4. View student details');
        console.log('   5. Approve or Reject verification');
        console.log('   6. Verify student receives notification\n');

        console.log('📝 API ENDPOINTS TO TEST:');
        console.log('   GET  /api/moderator/verification/queue');
        console.log('   GET  /api/moderator/verification/count');
        console.log('   GET  /api/moderator/verification/:studentId');
        console.log('   POST /api/moderator/verification/:studentId/approve');
        console.log('   POST /api/moderator/verification/:studentId/reject\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

setupPhase3VerificationData();
