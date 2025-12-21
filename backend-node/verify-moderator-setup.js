/**
 * Verify Moderator Setup
 * Quick verification that the moderator account was created correctly
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/placement-portal');
        console.log('✅ Connected to MongoDB\n');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const verifySetup = async () => {
    try {
        const db = mongoose.connection.db;

        // Check moderator
        const moderator = await db.collection('users').findOne({ username: 'niruban' });

        if (!moderator) {
            console.log('❌ Moderator "niruban" NOT found!');
            console.log('   Run: node create-moderator-niruban.js');
            return;
        }

        console.log('=== MODERATOR ACCOUNT ===');
        console.log('✅ Username:', moderator.username);
        console.log('✅ Email:', moderator.email);
        console.log('✅ Role:', moderator.role);
        console.log('✅ Department:', moderator.department);
        console.log('✅ College ID:', moderator.collegeId);
        console.log('✅ Status:', moderator.status);

        // Check students with same college ID
        const matchingStudents = await db.collection('studentdatas')
            .find({ collegeId: moderator.collegeId })
            .limit(5)
            .toArray();

        console.log('\n=== MATCHING STUDENTS ===');
        console.log(`Found ${matchingStudents.length} students with matching college ID\n`);

        for (const student of matchingStudents) {
            const deptMatch = student.personal?.branch === moderator.department;
            console.log('Student ID:', student._id);
            console.log('  College ID Match:', student.collegeId.toString() === moderator.collegeId.toString() ? '✅ YES' : '❌ NO');
            console.log('  Department:', student.personal?.branch, deptMatch ? '✅ MATCH' : '⚠️  DIFFERENT');
            console.log('');
        }

        console.log('=== READY TO TEST ===');
        console.log('1. Navigate to: http://localhost:3000/login/moderator');
        console.log('2. Login with:');
        console.log('   Username: niruban');
        console.log('   Password: niruban');
        console.log('3. Go to Verification Queue');
        console.log('4. Click "Review" on any student');
        console.log('5. Student details should load successfully! ✅\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB');
    }
};

connectDB().then(verifySetup);
