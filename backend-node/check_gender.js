const mongoose = require('mongoose');
require('dotenv').config();

async function checkGender() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('studentdatas');

    const badRecords = await collection.find({
        'personal.gender': { $in: ['Male', 'Female', 'Other', 'Prefer not to say'] }
    }).toArray();

    console.log(`Found ${badRecords.length} records with capitalized gender`);
    badRecords.forEach(r => {
        console.log(`User: ${r.userId}, Gender: "${r.personal?.gender}"`);
    });

    // Also check for the specific user
    const ganeshRecord = await collection.findOne({ 'personal.email': /ganesh/i });
    if (ganeshRecord) {
        console.log('\nGanesh record gender:', ganeshRecord.personal?.gender);
    }

    process.exit(0);
}

checkGender();
