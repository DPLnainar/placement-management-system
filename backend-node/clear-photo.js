const mongoose = require('mongoose');
require('dotenv').config();

async function clearPhotoUrl() {
    console.log('🔧 Clearing old photo URLs from database...\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const StudentData = mongoose.model('StudentData', new mongoose.Schema({}, { strict: false }));

        // Find students with photoUrl
        const result = await StudentData.updateMany(
            { 'personal.photoUrl': { $exists: true } },
            { $unset: { 'personal.photoUrl': '' } }
        );

        console.log(`✅ Cleared photo URLs from ${result.modifiedCount} student(s)\n`);
        console.log('You can now upload a new photo from the frontend!');

        await mongoose.disconnect();
        console.log('\n✅ Done');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
}

clearPhotoUrl();
