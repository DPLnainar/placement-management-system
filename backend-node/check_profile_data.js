const mongoose = require('mongoose');
require('dotenv').config();

async function checkProfile() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('studentdatas');

    const student = await collection.findOne({ 'personal.email': /ganesh/i });

    if (student) {
        console.log('\n=== PERSONAL INFO ===');
        console.log('Full Name:', student.personal?.fullName);
        console.log('Email:', student.personal?.email);
        console.log('Phone:', student.personal?.phone);
        console.log('DOB:', student.personal?.dob);

        console.log('\n=== EDUCATION - 10TH ===');
        console.log('Institution:', student.education?.tenth?.institution);
        console.log('Percentage:', student.education?.tenth?.percentage);
        console.log('Board:', student.education?.tenth?.board);
        console.log('Year:', student.education?.tenth?.yearOfPassing);

        console.log('\n=== EDUCATION - 12TH ===');
        console.log('Institution:', student.education?.twelfth?.institution);
        console.log('Percentage:', student.education?.twelfth?.percentage);
        console.log('Board:', student.education?.twelfth?.board);
        console.log('Year:', student.education?.twelfth?.yearOfPassing);

        console.log('\n=== EDUCATION - GRADUATION ===');
        console.log('College:', student.education?.graduation?.college);
        console.log('Degree:', student.education?.graduation?.degree);
        console.log('Branch:', student.education?.graduation?.branch);
        console.log('CGPA:', student.education?.graduation?.cgpa);
    } else {
        console.log('No student found!');
    }

    process.exit(0);
}

checkProfile();
