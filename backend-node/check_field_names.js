const mongoose = require('mongoose');
require('dotenv').config();

async function checkFieldNames() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('studentdatas');

    const student = await collection.findOne({ 'personal.email': /ganesh/i });

    if (student) {
        console.log('\n=== RAW 10TH DATA ===');
        console.log(JSON.stringify(student.education?.tenth, null, 2));

        console.log('\n=== RAW 12TH DATA ===');
        console.log(JSON.stringify(student.education?.twelfth, null, 2));
    }

    process.exit(0);
}

checkFieldNames();
