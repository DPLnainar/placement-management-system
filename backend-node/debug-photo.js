const mongoose = require('mongoose');
require('dotenv').config();

async function debugPhotoIssue() {
    console.log('🔍 Debugging Photo Upload Issue...\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const StudentData = mongoose.model('StudentData', new mongoose.Schema({}, { strict: false }));

        const allStudents = await StudentData.find({}).limit(3);

        console.log(`📊 Total students: ${await StudentData.countDocuments()}\n`);

        if (allStudents.length > 0) {
            console.log('🔍 Sample student data:\n');
            allStudents.forEach((student, index) => {
                console.log(`Student ${index + 1}:`);
                console.log(`   Name: ${student.personal?.name || 'NOT SET'}`);
                console.log(`   Email: ${student.personal?.email || 'NOT SET'}`);
                console.log(`   Photo URL: ${student.personal?.photoUrl || 'NOT SET'}`);
                console.log('');
            });

            const withPhoto = await StudentData.findOne({ 'personal.photoUrl': { $exists: true, $ne: null, $ne: '' } });
            if (withPhoto) {
                console.log('✅ Found student with photo:');
                console.log(`   Photo URL: ${withPhoto.personal.photoUrl}`);
            } else {
                console.log('⚠️  No students have photoUrl set\n');
                console.log('Possible reasons:');
                console.log('1. Photo upload API was not called');
                console.log('2. Photo upload failed silently');
                console.log('3. Photo saved but database not updated');
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ Done');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
}

debugPhotoIssue();
