/**
 * Check Who Is Logged In
 * Decode the JWT token to see who is actually logged in
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

const checkAllUsers = async () => {
    try {
        const db = mongoose.connection.db;

        console.log('=== ALL MODERATORS IN DATABASE ===\n');

        const moderators = await db.collection('users').find({ role: 'moderator' }).toArray();

        if (moderators.length === 0) {
            console.log('❌ NO MODERATORS FOUND!');
            console.log('   This is the problem - no moderator accounts exist.');
            console.log('   Run: node create-moderator-niruban.js');
            return;
        }

        console.log(`Found ${moderators.length} moderator(s):\n`);

        for (const mod of moderators) {
            console.log(`Username: ${mod.username}`);
            console.log(`  Email: ${mod.email}`);
            console.log(`  College ID: ${mod.collegeId}`);
            console.log(`  Department: ${mod.department}`);
            console.log(`  Status: ${mod.status}`);
            console.log('');
        }

        console.log('=== STUDENT 693abfc939b59c211a1efdc1 ===\n');

        const studentId = '693abfc939b59c211a1efdc1';
        const student = await db.collection('studentdatas').findOne({
            _id: new mongoose.Types.ObjectId(studentId)
        });

        if (!student) {
            console.log('❌ Student not found!');
            return;
        }

        console.log(`College ID: ${student.collegeId}`);
        console.log(`Department: ${student.personal?.branch}`);
        console.log('');

        console.log('=== AUTHORIZATION MATRIX ===\n');
        console.log('Which moderators can access this student?\n');

        for (const mod of moderators) {
            const collegeMatch = mod.collegeId?.toString() === student.collegeId?.toString();
            const deptMatch = mod.department === student.personal?.branch;
            const canAccess = collegeMatch && deptMatch;

            console.log(`${mod.username}:`);
            console.log(`  College Match: ${collegeMatch ? '✅' : '❌'} (Mod: ${mod.collegeId}, Student: ${student.collegeId})`);
            console.log(`  Dept Match: ${deptMatch ? '✅' : '❌'} (Mod: ${mod.department}, Student: ${student.personal?.branch})`);
            console.log(`  Can Access: ${canAccess ? '✅ YES' : '❌ NO'}`);
            console.log('');
        }

        console.log('=== RECOMMENDATION ===');
        const nirub = moderators.find(m => m.username === 'niruban');
        if (nirub) {
            const match = nirub.collegeId?.toString() === student.collegeId?.toString() &&
                nirub.department === student.personal?.branch;
            if (match) {
                console.log('✅ Moderator "niruban" SHOULD be able to access this student.');
                console.log('   If you still get an error, the backend is not picking up the database changes.');
                console.log('   Try: Kill all node processes and restart backend.');
            } else {
                console.log('❌ Moderator "niruban" CANNOT access this student due to mismatch.');
                console.log('   Updating moderator to match student...');
                await db.collection('users').updateOne(
                    { username: 'niruban' },
                    {
                        $set: {
                            collegeId: student.collegeId,
                            department: student.personal?.branch
                        }
                    }
                );
                console.log('✅ Updated! Restart backend and try again.');
            }
        } else {
            console.log('❌ Moderator "niruban" not found!');
            console.log('   Run: node create-moderator-niruban.js');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

connectDB().then(checkAllUsers);
