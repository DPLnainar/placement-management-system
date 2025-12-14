import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function debugPhotoIssue() {
    console.log('🔍 Debugging Photo Upload Issue...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('✅ Connected to MongoDB\n');

        // Get StudentData model
        const StudentData = mongoose.model('StudentData', new mongoose.Schema({}, { strict: false }));

        // Find all students
        const allStudents = await StudentData.find({}).limit(3);

        console.log(`📊 Total students in database: ${await StudentData.countDocuments()}\n`);

        if (allStudents.length > 0) {
            console.log('🔍 Sample student data structure:\n');
            allStudents.forEach((student: any, index: number) => {
                console.log(`Student ${index + 1}:`);
                console.log(`   _id: ${student._id}`);
                console.log(`   userId: ${student.userId}`);
                console.log(`   personal object keys:`, Object.keys(student.personal || {}));
                console.log(`   personal.photoUrl: ${student.personal?.photoUrl || 'NOT SET'}`);
                console.log(`   personal.name: ${student.personal?.name || 'NOT SET'}`);
                console.log(`   personal.email: ${student.personal?.email || 'NOT SET'}`);
                console.log('');
            });

            // Check if any student has photoUrl set
            const withPhoto = await StudentData.findOne({ 'personal.photoUrl': { $exists: true, $ne: null, $ne: '' } });
            if (withPhoto) {
                console.log('✅ Found student with photo:');
                console.log(`   Photo URL: ${withPhoto.personal.photoUrl}`);
            } else {
                console.log('⚠️  No students have photoUrl set');
                console.log('   This means either:');
                console.log('   1. Photo upload failed');
                console.log('   2. Photo was uploaded but not saved to database');
                console.log('   3. Photo is saved under different field name');
            }
        } else {
            console.log('⚠️  No students found in database');
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

debugPhotoIssue();
