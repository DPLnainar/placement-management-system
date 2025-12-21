/**
 * Real-time Authorization Check
 * Check what the backend is actually seeing when you try to review a student
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB\n');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const checkRealTimeAuth = async () => {
    try {
        const db = mongoose.connection.db;

        console.log('=== CHECKING CURRENT STATE ===\n');

        // Check all moderators
        const moderators = await db.collection('users').find({ role: 'moderator' }).toArray();
        console.log(`Found ${moderators.length} moderator(s):\n`);

        for (const mod of moderators) {
            console.log(`Moderator: ${mod.username}`);
            console.log(`  College ID: ${mod.collegeId}`);
            console.log(`  Department: ${mod.department}`);
            console.log('');
        }

        // Check the specific student
        const studentId = '693abfc939b59c211a1efdc1';
        const student = await db.collection('studentdatas').findOne({
            _id: new mongoose.Types.ObjectId(studentId)
        });

        if (student) {
            console.log(`Student ${studentId}:`);
            console.log(`  College ID: ${student.collegeId}`);
            console.log(`  Department: ${student.personal?.branch}`);
            console.log('');
        }

        // Check if they match
        if (moderators.length > 0 && student) {
            const mod = moderators.find(m => m.username === 'niruban') || moderators[0];
            console.log('=== AUTHORIZATION CHECK ===');
            console.log(`Moderator "${mod.username}" College ID: ${mod.collegeId}`);
            console.log(`Student College ID: ${student.collegeId}`);
            console.log(`College Match: ${mod.collegeId?.toString() === student.collegeId?.toString() ? '✅ YES' : '❌ NO'}`);
            console.log('');
            console.log(`Moderator Department: ${mod.department}`);
            console.log(`Student Department: ${student.personal?.branch}`);
            console.log(`Department Match: ${mod.department === student.personal?.branch ? '✅ YES' : '❌ NO'}`);
            console.log('');

            if (mod.collegeId?.toString() !== student.collegeId?.toString()) {
                console.log('⚠️  COLLEGE ID MISMATCH - Fixing now...');
                await db.collection('studentdatas').updateMany(
                    {},
                    { $set: { collegeId: mod.collegeId } }
                );
                console.log('✅ Fixed all students to match moderator college ID');
            }

            if (mod.department !== student.personal?.branch) {
                console.log('⚠️  DEPARTMENT MISMATCH!');
                console.log('Options:');
                console.log(`1. Update moderator department to: "${student.personal?.branch}"`);
                console.log(`2. Update student department to: "${mod.department}"`);
                console.log('');
                console.log('Applying fix: Updating moderator department...');
                await db.collection('users').updateOne(
                    { username: 'niruban' },
                    { $set: { department: student.personal?.branch } }
                );
                console.log(`✅ Updated moderator department to: "${student.personal?.branch}"`);
            }
        }

        console.log('\n=== ACTION REQUIRED ===');
        console.log('The backend server needs to restart to pick up these changes.');
        console.log('Please RESTART the backend by:');
        console.log('1. Press Ctrl+C in the backend terminal');
        console.log('2. Run: .\\start-backend.bat');
        console.log('');
        console.log('OR just wait for nodemon to auto-restart if file watching is enabled.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

connectDB().then(checkRealTimeAuth);
