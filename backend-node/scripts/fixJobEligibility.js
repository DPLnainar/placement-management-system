require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Direct MongoDB Update for Job Eligibility
 */

const updateJobEligibility = async () => {
    try {
        console.log('\n🔧 Updating Job Eligibility via Direct MongoDB Update...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const jobsCollection = db.collection('jobs');

        // Update Software Engineer job
        const softwareResult = await jobsCollection.updateOne(
            { company: 'Tech Corp', title: 'Software Engineer' },
            {
                $set: {
                    'eligibility.maxBacklogs': 0,
                    'eligibility.minCGPA': 7.0,
                    'eligibility.allowedBranches': ['Computer Science', 'Information Technology'],
                    'eligibility.allowedYears': [4],
                    'eligibility.allowArrears': false
                }
            }
        );
        console.log('✅ Software Engineer:', softwareResult.modifiedCount, 'document(s) updated');

        // Update Data Analyst job
        const dataResult = await jobsCollection.updateOne(
            { company: 'Data Solutions Inc', title: 'Data Analyst' },
            {
                $set: {
                    'eligibility.maxBacklogs': 1,
                    'eligibility.minCGPA': 6.0,
                    'eligibility.allowedBranches': ['Computer Science', 'Information Technology'],
                    'eligibility.allowedYears': [4],
                    'eligibility.allowArrears': true
                }
            }
        );
        console.log('✅ Data Analyst:', dataResult.modifiedCount, 'document(s) updated');

        // Verify the updates
        const jobs = await jobsCollection.find({
            company: { $in: ['Tech Corp', 'Data Solutions Inc'] }
        }).toArray();

        console.log('\n📋 UPDATED JOB ELIGIBILITY:\n');
        for (const job of jobs) {
            console.log(`${job.title}:`);
            console.log('  Min CGPA:', job.eligibility?.minCGPA);
            console.log('  Max Backlogs:', job.eligibility?.maxBacklogs);
            console.log('  Allowed Branches:', job.eligibility?.allowedBranches);
            console.log('  Allowed Years:', job.eligibility?.allowedYears);
            console.log('  Allow Arrears:', job.eligibility?.allowArrears);
            console.log('');
        }

        console.log('✅ Job eligibility criteria updated successfully!\n');
        console.log('🔄 Please refresh the admin dashboard to see the updated eligibility counts.\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

updateJobEligibility();
