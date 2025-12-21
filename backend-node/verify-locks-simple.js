const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyLockLogicDirect() {
    console.log('--- Starting Direct Database Verification ---');

    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-system');
        console.log('✅ Connected to MongoDB');

        const StudentData = mongoose.model('StudentData', new mongoose.Schema({
            userId: mongoose.Schema.Types.ObjectId,
            personalInfoLocked: Boolean,
            academicInfoLocked: Boolean,
            personal: Object,
            education: Object,
            department: String
        }, { collection: 'studentdatas' }));

        // 1. Find any student
        const student = await StudentData.findOne({});
        if (!student) {
            console.log('❌ No students found in database');
            return;
        }
        console.log(`✅ Found student: ${student.personal?.name || student.email || student._id} (ID: ${student._id})`);

        // 2. Manually toggle lock (Simulate Moderator action)
        console.log('\nSimulating Moderator Unlock...');
        student.personalInfoLocked = false;
        await student.save();
        console.log('✅ Student personalInfoLocked set to false');

        // Verify it's saved
        const updatedStudent = await StudentData.findById(student._id);
        console.log(`Lock Status: ${updatedStudent.personalInfoLocked ? 'Locked' : 'Unlocked'}`);

        // 3. Manually toggle lock (Simulate Student attempt - if we were in the controller)
        // Since we are direct DB, we already verified the controller logic code in previous steps.
        // This confirms the schema supports the fields.

        console.log('\nResetting to Locked status...');
        updatedStudent.personalInfoLocked = true;
        await updatedStudent.save();
        console.log('✅ Student personalInfoLocked reset to true');

    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

verifyLockLogicDirect();
