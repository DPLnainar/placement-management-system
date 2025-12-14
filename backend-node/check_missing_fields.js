const mongoose = require('mongoose');
require('dotenv').config();

async function checkFields() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('studentdatas');

    const student = await collection.findOne({ 'personal.email': /ganesh/i });

    console.log('\n=== CHECKING MISSING FIELDS ===');
    console.log('\nDOB:', student.personal?.dob);
    console.log('DOB type:', typeof student.personal?.dob);

    console.log('\n10th School Name:', student.education?.tenth?.schoolName);
    console.log('10th Institution:', student.education?.tenth?.institution);

    console.log('\n12th School Name:', student.education?.twelfth?.schoolName);
    console.log('12th Institution:', student.education?.twelfth?.institution);

    console.log('\nCurrent Arrears:', student.currentArrears);
    console.log('Arrear History:', student.arrearHistory);
    console.log('Current Backlogs:', student.currentBacklogs);

    process.exit(0);
}

checkFields();
