require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const StudentData = require('../models/StudentData');
const User = require('../models/User');

/**
 * Debug Eligibility Issue
 * Check job criteria and student data
 */

const debugEligibility = async () => {
    try {
        console.log('\n🔍 Debugging Eligibility Issue...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all jobs
        const jobs = await Job.find({ company: { $in: ['Tech Corp', 'Data Solutions Inc'] } });

        console.log('📋 JOB ELIGIBILITY CRITERIA:\n');
        for (const job of jobs) {
            console.log(`\n${job.title} @ ${job.company}:`);
            console.log('  Criteria:', JSON.stringify(job.eligibilityCriteria, null, 2));
        }

        // Get all test students
        const students = await User.find({
            username: { $in: ['teststudent1', 'teststudent2', 'teststudent3'] }
        });

        console.log('\n\n👥 STUDENT DATA:\n');
        for (const student of students) {
            const studentData = await StudentData.findOne({ userId: student._id });
            console.log(`\n${student.username}:`);
            console.log('  CGPA:', studentData?.cgpa);
            console.log('  Current Backlogs:', studentData?.currentBacklogs);
            console.log('  Total Backlogs:', studentData?.totalBacklogs);
            console.log('  Branch:', studentData?.personal?.branch);
            console.log('  Semester:', studentData?.semester);
        }

        // Test eligibility calculation
        console.log('\n\n🧪 ELIGIBILITY TEST:\n');
        const softwareJob = jobs.find(j => j.company === 'Tech Corp');

        if (softwareJob) {
            console.log(`\nTesting eligibility for: ${softwareJob.title}`);
            console.log('Criteria:', {
                minCGPA: softwareJob.eligibilityCriteria?.minCGPA,
                maxCurrentBacklogs: softwareJob.eligibilityCriteria?.maxCurrentBacklogs,
                eligibleBranches: softwareJob.eligibilityCriteria?.eligibleBranches
            });

            for (const student of students) {
                const studentData = await StudentData.findOne({ userId: student._id });
                const result = softwareJob.checkEligibility(studentData);
                console.log(`\n  ${student.username}:`);
                console.log('    Eligible:', result.isEligible);
                console.log('    Issues:', result.issues);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

debugEligibility();
