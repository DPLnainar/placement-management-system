/**
 * Check College IDs - Diagnostic Script
 * Check if moderator and students have matching college IDs
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/placement-portal');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const checkCollegeIds = async () => {
    try {
        const db = mongoose.connection.db;

        // Find the moderator user (niruban) directly from the collection
        const moderator = await db.collection('users').findOne({ username: 'niruban' });

        if (!moderator) {
            console.log('❌ Moderator "niruban" not found');
            return;
        }

        console.log('\n=== MODERATOR INFO ===');
        console.log('Username:', moderator.username);
        console.log('College ID:', moderator.collegeId);
        console.log('Department:', moderator.department);
        console.log('Role:', moderator.role);

        // Find all students directly from the collection
        const students = await db.collection('studentdatas').find({}).limit(10).toArray();

        console.log('\n=== STUDENTS INFO ===');
        console.log(`Found ${students.length} students\n`);

        for (const student of students) {
            const match = student.collegeId?.toString() === moderator.collegeId?.toString();
            const deptMatch = student.personal?.branch === moderator.department;

            console.log('---');
            console.log('Student ID:', student._id);
            console.log('College ID:', student.collegeId);
            console.log('Department:', student.personal?.branch);
            console.log('College Match?', match ? '✅ YES' : '❌ NO');
            console.log('Dept Match?', deptMatch ? '✅ YES' : '❌ NO');
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

connectDB().then(checkCollegeIds);
