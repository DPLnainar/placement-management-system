import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkPhotoUrl() {
    console.log('🔍 Checking Student Photo URLs in Database...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('✅ Connected to MongoDB\n');

        // Get StudentData model
        const StudentData = mongoose.model('StudentData', new mongoose.Schema({}, { strict: false }));

        // Find students with photos
        const studentsWithPhotos = await StudentData.find({
            'personal.photoUrl': { $exists: true, $ne: '' }
        }).limit(5);

        if (studentsWithPhotos.length === 0) {
            console.log('⚠️  No students with photos found in database');
        } else {
            console.log(`📸 Found ${studentsWithPhotos.length} student(s) with photos:\n`);

            studentsWithPhotos.forEach((student: any, index: number) => {
                console.log(`Student ${index + 1}:`);
                console.log(`   Name: ${student.personal?.name || 'N/A'}`);
                console.log(`   Email: ${student.personal?.email || 'N/A'}`);
                console.log(`   Photo URL: ${student.personal?.photoUrl}`);

                // Check if URL is S3
                if (student.personal?.photoUrl?.includes('s3')) {
                    console.log(`   ✅ S3 URL detected`);
                } else if (student.personal?.photoUrl?.includes('cloudinary')) {
                    console.log(`   ⚠️  Cloudinary URL (old)`);
                } else {
                    console.log(`   ⚠️  Unknown URL format`);
                }
                console.log('');
            });
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

checkPhotoUrl();
