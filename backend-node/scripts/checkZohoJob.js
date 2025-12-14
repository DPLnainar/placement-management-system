require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Check Zoho Job Eligibility Data
 */

const checkZohoJob = async () => {
    try {
        console.log('\n🔍 Checking Zoho Job Data...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const jobsCollection = db.collection('jobs');
        const studentsCollection = db.collection('studentdatas');

        // Find Zoho job
        const zohoJob = await jobsCollection.findOne({
            $or: [
                { company: /zoho/i },
                { companyName: /zoho/i }
            ]
        });

        if (!zohoJob) {
            console.log('❌ Zoho job not found in database');
            console.log('\nSearching for all recent jobs...');
            const recentJobs = await jobsCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
            console.log('\nRecent jobs:');
            recentJobs.forEach(job => {
                console.log(`  - ${job.title} @ ${job.company || job.companyName}`);
            });
            process.exit(1);
        }

        console.log('📋 ZOHO JOB DATA:\n');
        console.log('Title:', zohoJob.title);
        console.log('Company:', zohoJob.company || zohoJob.companyName);
        console.log('\nEligibility Criteria:');
        console.log(JSON.stringify(zohoJob.eligibility, null, 2));

        // Get student data
        console.log('\n\n👥 STUDENT DATA:\n');
        const students = await studentsCollection.find({
            rollNumber: { $in: ['CS2021001', 'CS2021002', 'IT2021001'] }
        }).toArray();

        for (const student of students) {
            console.log(`${student.rollNumber}:`);
            console.log('  CGPA:', student.cgpa);
            console.log('  10th %:', student.tenthPercentage || student.personal?.tenthPercentage);
            console.log('  12th %:', student.twelfthPercentage || student.personal?.twelfthPercentage);
            console.log('  Current Backlogs:', student.currentBacklogs);
            console.log('  Branch:', student.personal?.branch);
            console.log('  Semester:', student.semester);
            console.log('');
        }

        console.log('\n🔍 ELIGIBILITY CHECK ANALYSIS:\n');
        console.log('Job Requirements:');
        console.log('  - 10th %:', zohoJob.eligibility?.tenthPct);
        console.log('  - 12th %:', zohoJob.eligibility?.twelfthPct);
        console.log('  - Min CGPA:', zohoJob.eligibility?.minCGPA || zohoJob.eligibility?.cgpa);
        console.log('  - Max Backlogs:', zohoJob.eligibility?.maxBacklogs);
        console.log('  - Allowed Branches:', zohoJob.eligibility?.allowedBranches || zohoJob.eligibility?.deptList);
        console.log('  - Allowed Years:', zohoJob.eligibility?.allowedYears);

        console.log('\n⚠️  POTENTIAL ISSUES:\n');

        // Check if students have 10th/12th data
        const missingData = students.filter(s =>
            !s.tenthPercentage && !s.personal?.tenthPercentage
        );

        if (missingData.length > 0) {
            console.log('❌ Students missing 10th/12th percentage data:');
            missingData.forEach(s => console.log(`   - ${s.rollNumber}`));
            console.log('\n   This is likely why they show as NOT ELIGIBLE!');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

checkZohoJob();
