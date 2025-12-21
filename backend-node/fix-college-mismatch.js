/**
 * Fix College ID Mismatch
 * This script identifies and fixes college ID mismatches between moderators and students
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

const fixCollegeMismatch = async () => {
    try {
        const db = mongoose.connection.db;

        // Find all moderators
        const moderators = await db.collection('users').find({ role: 'moderator' }).toArray();

        console.log('\n=== MODERATORS ===');
        console.log(`Found ${moderators.length} moderators\n`);

        for (const mod of moderators) {
            console.log('---');
            console.log('Username:', mod.username);
            console.log('College ID:', mod.collegeId);
            console.log('Department:', mod.department);
        }

        // Find the specific student causing the error
        const studentId = '693abfc939b59c211a1efdc1';
        const student = await db.collection('studentdatas').findOne({
            _id: new mongoose.Types.ObjectId(studentId)
        });

        if (student) {
            console.log('\n=== PROBLEM STUDENT ===');
            console.log('Student ID:', student._id);
            console.log('College ID:', student.collegeId);
            console.log('Department:', student.personal?.branch);
        } else {
            console.log('\n❌ Student not found');
        }

        // Find all students and check their college IDs
        const students = await db.collection('studentdatas').find({}).limit(5).toArray();

        console.log('\n=== SAMPLE STUDENTS ===');
        for (const s of students) {
            console.log('---');
            console.log('Student ID:', s._id);
            console.log('College ID:', s.collegeId);
            console.log('Department:', s.personal?.branch);
        }

        // Check if there's a college in the database
        const colleges = await db.collection('colleges').find({}).toArray();
        console.log('\n=== COLLEGES ===');
        console.log(`Found ${colleges.length} colleges\n`);
        for (const college of colleges) {
            console.log('---');
            console.log('College ID:', college._id);
            console.log('Name:', college.name);
            console.log('Status:', college.status);
        }

        // Propose fix
        console.log('\n=== ANALYSIS ===');
        if (moderators.length > 0 && students.length > 0) {
            const mod = moderators[0];
            const stu = students[0];

            if (!mod.collegeId) {
                console.log('⚠️  ISSUE: Moderator has no college ID');
                console.log('💡 FIX: Need to assign college ID to moderator');
            } else if (!stu.collegeId) {
                console.log('⚠️  ISSUE: Student has no college ID');
                console.log('💡 FIX: Need to assign college ID to students');
            } else if (mod.collegeId.toString() !== stu.collegeId.toString()) {
                console.log('⚠️  ISSUE: College IDs do not match');
                console.log('   Moderator College ID:', mod.collegeId);
                console.log('   Student College ID:', stu.collegeId);
                console.log('💡 FIX: Need to update either moderator or student college ID');
            } else {
                console.log('✅ College IDs match - issue might be elsewhere');
            }
        }

        // Ask if user wants to apply fix
        console.log('\n📝 To apply automatic fix, run: node apply-college-fix.js');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

connectDB().then(fixCollegeMismatch);
