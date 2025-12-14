const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

const StudentData = require('./models/StudentData');

async function checkCurrentState() {
    try {
        const student = await StudentData.findOne({}).lean();

        if (!student) {
            console.log('No student found');
            process.exit(1);
        }

        console.log('\n========================================');
        console.log('CURRENT DATABASE STATE');
        console.log('========================================\n');

        console.log('Student:', student.personal?.name || student.personal?.fullName);
        console.log('\n--- 10th Standard ---');
        console.log('School Name:', student.education?.tenth?.schoolName || '(NOT SET)');
        console.log('Board:', student.education?.tenth?.board || '(NOT SET)');
        console.log('Percentage:', student.education?.tenth?.percentage || '(NOT SET)');
        console.log('Year:', student.education?.tenth?.yearOfPassing || '(NOT SET)');

        console.log('\n--- 12th Standard ---');
        console.log('School Name:', student.education?.twelfth?.schoolName || '(NOT SET)');
        console.log('Board:', student.education?.twelfth?.board || '(NOT SET)');
        console.log('Percentage:', student.education?.twelfth?.percentage || '(NOT SET)');
        console.log('Year:', student.education?.twelfth?.yearOfPassing || '(NOT SET)');

        console.log('\n========================================\n');

        if (student.education?.tenth?.schoolName && student.education?.twelfth?.schoolName) {
            console.log('✅ Both school names are SET in the database!');
            console.log('The fix is working correctly.\n');
        } else if (student.education?.tenth?.schoolName || student.education?.twelfth?.schoolName) {
            console.log('⚠️  Only one school name is set.');
            console.log('You may need to fill in the other one.\n');
        } else {
            console.log('ℹ️  School names are not yet filled in.');
            console.log('Please fill them in through the UI and save.\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCurrentState();
