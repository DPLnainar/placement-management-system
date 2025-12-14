const mongoose = require('mongoose');
require('dotenv').config();

async function checkAndFixPhoto() {
    console.log('🔍 Checking student photo URLs...\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const StudentData = mongoose.model('StudentData', new mongoose.Schema({}, { strict: false }));

        // Find all students
        const students = await StudentData.find({});

        console.log(`📊 Total students: ${students.length}\n`);

        let foundPhotos = 0;
        students.forEach((student, index) => {
            if (student.personal?.photoUrl) {
                foundPhotos++;
                console.log(`Student ${index + 1}:`);
                console.log(`   Name: ${student.personal?.name || 'N/A'}`);
                console.log(`   Email: ${student.personal?.email || 'N/A'}`);
                console.log(`   Photo URL: ${student.personal.photoUrl}`);

                // Check URL type
                if (student.personal.photoUrl.includes('cloudinary')) {
                    console.log(`   ⚠️  CLOUDINARY URL (old - may not work with S3 config)`);
                } else if (student.personal.photoUrl.includes('s3')) {
                    console.log(`   ✅ S3 URL`);
                } else {
                    console.log(`   ⚠️  Unknown URL type`);
                }
                console.log('');
            }
        });

        console.log(`\n📸 Found ${foundPhotos} student(s) with photos`);

        if (foundPhotos === 0) {
            console.log('\n⚠️  No photos found in database');
            console.log('   This means the photo upload did not save to database');
        }

        await mongoose.disconnect();
        console.log('\n✅ Done');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
}

checkAndFixPhoto();
