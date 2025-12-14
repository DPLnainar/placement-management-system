require('dotenv').config();
const mongoose = require('mongoose');
const StudentData = require('../models/StudentData');
const Job = require('../models/Job');

/**
 * Fix Student Data - Update semester to 8 (4th year)
 */

const fixStudentData = async () => {
    try {
        console.log('\n🔧 Fixing Student Data...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Update all test students to semester 8 (4th year)
        const result = await StudentData.updateMany(
            { rollNumber: { $in: ['CS2021001', 'CS2021002', 'IT2021001'] } },
            {
                $set: {
                    semester: 8,
                    'personal.semester': 8
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} student records to semester 8 (4th year)\n`);

        // Verify the update
        const students = await StudentData.find({
            rollNumber: { $in: ['CS2021001', 'CS2021002', 'IT2021001'] }
        });

        console.log('📋 UPDATED STUDENT DATA:\n');
        for (const student of students) {
            console.log(`${student.rollNumber}:`);
            console.log(`  Semester: ${student.semester}`);
            console.log(`  CGPA: ${student.cgpa}`);
            console.log(`  Current Backlogs: ${student.currentBacklogs}`);
            console.log(`  Branch: ${student.personal?.branch}\n`);
        }

        // Check job eligibility criteria
        const jobs = await Job.find({ company: { $in: ['Tech Corp', 'Data Solutions Inc'] } });
        console.log('💼 JOB ELIGIBILITY CRITERIA:\n');
        for (const job of jobs) {
            console.log(`${job.title}:`);
            console.log(`  Min CGPA: ${job.eligibilityCriteria?.minCGPA}`);
            console.log(`  Max Backlogs: ${job.eligibilityCriteria?.maxCurrentBacklogs}`);
            console.log(`  Eligible Years: ${job.eligibilityCriteria?.eligibleYears}`);
            console.log(`  Branches: ${job.eligibilityCriteria?.eligibleBranches}\n`);
        }

        console.log('✅ Fix complete! Students are now in 4th year (semester 8)\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

fixStudentData();
