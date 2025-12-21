/**
 * Check Login and Authorization
 * Simulates the login and authorization flow to debug the issue
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal';
        console.log('Connecting to:', uri.substring(0, 30) + '...');
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB\n');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const checkLoginAndAuth = async () => {
    try {
        const db = mongoose.connection.db;

        // Step 1: Try to login
        console.log('=== STEP 1: LOGIN CHECK ===');
        const user = await db.collection('users').findOne({ username: 'niruban' });

        if (!user) {
            console.log('❌ User "niruban" NOT FOUND in database!');
            console.log('   The moderator account does not exist.');
            console.log('   Run: node create-moderator-niruban.js');
            return;
        }

        console.log('✅ User found:', user.username);
        console.log('   Role:', user.role);
        console.log('   College ID:', user.collegeId);
        console.log('   Department:', user.department);

        // Verify password
        const passwordMatch = await bcrypt.compare('niruban', user.password);
        console.log('   Password valid:', passwordMatch ? '✅ YES' : '❌ NO');

        if (!passwordMatch) {
            console.log('   ⚠️  Password does not match!');
            return;
        }

        // Step 2: Check authorization for the specific student
        console.log('\n=== STEP 2: AUTHORIZATION CHECK ===');
        const studentId = '693abfc939b59c211a1efdc1';
        const student = await db.collection('studentdatas').findOne({
            _id: new mongoose.Types.ObjectId(studentId)
        });

        if (!student) {
            console.log('❌ Student not found:', studentId);
            return;
        }

        console.log('✅ Student found');
        console.log('   Student College ID:', student.collegeId);
        console.log('   Student Department:', student.personal?.branch);

        // Check college match
        const collegeMatch = student.collegeId?.toString() === user.collegeId?.toString();
        console.log('\n   College ID Match:', collegeMatch ? '✅ YES' : '❌ NO');

        if (!collegeMatch) {
            console.log('   ⚠️  MISMATCH DETECTED:');
            console.log('      Moderator College:', user.collegeId);
            console.log('      Student College:', student.collegeId);
            console.log('\n   💡 FIX: Update student college ID to match moderator');

            // Offer to fix
            console.log('\n=== APPLYING FIX ===');
            const result = await db.collection('studentdatas').updateOne(
                { _id: new mongoose.Types.ObjectId(studentId) },
                { $set: { collegeId: user.collegeId } }
            );
            console.log('✅ Updated student college ID');
            console.log('   Modified count:', result.modifiedCount);
        } else {
            console.log('   ✅ College IDs match - authorization should work!');
        }

        // Check department match
        const deptMatch = student.personal?.branch === user.department;
        console.log('   Department Match:', deptMatch ? '✅ YES' : '❌ NO');

        if (!deptMatch) {
            console.log('   ⚠️  DEPARTMENT MISMATCH:');
            console.log('      Moderator Dept:', user.department);
            console.log('      Student Dept:', student.personal?.branch);
            console.log('\n   💡 This will also cause authorization to fail!');
            console.log('   💡 FIX: Update moderator department to match students');
        }

        console.log('\n=== SUMMARY ===');
        if (collegeMatch && deptMatch) {
            console.log('✅ All checks passed! Authorization should work.');
            console.log('   Try logging in again and clicking Review.');
        } else {
            console.log('❌ Authorization will fail due to mismatches above.');
            console.log('   Fixes have been applied. Try again!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

connectDB().then(checkLoginAndAuth);
