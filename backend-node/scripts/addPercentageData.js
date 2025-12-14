require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Add 10th and 12th Percentage Data to Test Students
 */

const addPercentageData = async () => {
    try {
        console.log('\n🔧 Adding 10th/12th Percentage Data to Students...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const studentsCollection = db.collection('studentdatas');

        // Update Student 1 - High performer
        await studentsCollection.updateOne(
            { rollNumber: 'CS2021001' },
            {
                $set: {
                    tenthPercentage: 85,
                    twelfthPercentage: 82,
                    'personal.tenthPercentage': 85,
                    'personal.twelfthPercentage': 82
                }
            }
        );
        console.log('✅ Updated CS2021001: 10th=85%, 12th=82%');

        // Update Student 2 - Good performer
        await studentsCollection.updateOne(
            { rollNumber: 'CS2021002' },
            {
                $set: {
                    tenthPercentage: 78,
                    twelfthPercentage: 75,
                    'personal.tenthPercentage': 78,
                    'personal.twelfthPercentage': 75
                }
            }
        );
        console.log('✅ Updated CS2021002: 10th=78%, 12th=75%');

        // Update Student 3 - Has backlog
        await studentsCollection.updateOne(
            { rollNumber: 'IT2021001' },
            {
                $set: {
                    tenthPercentage: 65,
                    twelfthPercentage: 62,
                    'personal.tenthPercentage': 65,
                    'personal.twelfthPercentage': 62
                }
            }
        );
        console.log('✅ Updated IT2021001: 10th=65%, 12th=62%');

        // Verify updates
        console.log('\n📋 UPDATED STUDENT DATA:\n');
        const students = await studentsCollection.find({
            rollNumber: { $in: ['CS2021001', 'CS2021002', 'IT2021001'] }
        }).toArray();

        for (const student of students) {
            console.log(`${student.rollNumber}:`);
            console.log('  10th %:', student.tenthPercentage);
            console.log('  12th %:', student.twelfthPercentage);
            console.log('  CGPA:', student.cgpa);
            console.log('  Backlogs:', student.currentBacklogs);
            console.log('');
        }

        console.log('✅ All students now have 10th and 12th percentage data!');
        console.log('\n🔄 Please refresh the admin dashboard to see updated eligibility counts.\n');
        console.log('Expected for Zoho job (60% in 10th/12th, 7.0 CGPA):');
        console.log('  ✅ Student 1 (85%, 82%, 8.5 CGPA) - ELIGIBLE');
        console.log('  ✅ Student 2 (78%, 75%, 7.8 CGPA) - ELIGIBLE');
        console.log('  ✅ Student 3 (65%, 62%, 6.5 CGPA) - ELIGIBLE (if CGPA req is 6.5 or less)\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

addPercentageData();
