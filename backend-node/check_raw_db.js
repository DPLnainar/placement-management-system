const mongoose = require('mongoose');
require('dotenv').config();

async function checkRawData() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('studentdatas');

    const student = await collection.findOne({ 'personal.email': /ganesh/i });

    console.log('\n=== RAW DATABASE DATA ===');
    console.log('\n10th Education:');
    console.log(JSON.stringify(student.education?.tenth, null, 2));

    console.log('\n12th Education:');
    console.log(JSON.stringify(student.education?.twelfth, null, 2));

    console.log('\nPersonal (photo):');
    console.log('photoUrl:', student.personal?.photoUrl);
    console.log('photoUrl type:', typeof student.personal?.photoUrl);

    process.exit(0);
}

checkRawData();
