require('dotenv').config();
const mongoose = require('mongoose');
const StudentData = require('../models/StudentData');
const User = require('../models/User');

/**
 * Check Student Backlog Data
 */

const checkBacklogs = async () => {
    try {
        console.log('\n🔍 Checking Student Backlog Data...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const students = await User.find({
            username: { $in: ['teststudent1', 'teststudent2', 'teststudent3'] }
        });

        console.log('📋 STUDENT BACKLOG DATA:\n');
        for (const student of students) {
            const studentData = await StudentData.findOne({ userId: student._id });
            console.log(`${student.username}:`);
            console.log('  currentBacklogs:', studentData?.currentBacklogs);
            console.log('  totalBacklogs:', studentData?.totalBacklogs);
            console.log('  historyOfArrears:', studentData?.historyOfArrears);
            console.log('  CGPA:', studentData?.cgpa);
            console.log('  Semester:', studentData?.semester);
            console.log('  Branch:', studentData?.personal?.branch);
            console.log('  Full StudentData:', JSON.stringify({
                currentBacklogs: studentData?.currentBacklogs,
                totalBacklogs: studentData?.totalBacklogs,
                cgpa: studentData?.cgpa,
                semester: studentData?.semester
            }, null, 2));
            console.log('');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

checkBacklogs();
