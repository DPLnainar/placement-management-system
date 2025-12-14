const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Import models
const StudentData = require('./models/StudentData');

async function testSchoolNamePersistence() {
    try {
        console.log('\n========================================');
        console.log('Testing School Name Persistence Fix');
        console.log('========================================\n');

        // Find the first student
        let student = await StudentData.findOne({});

        if (!student) {
            console.log('❌ No student found in database');
            process.exit(1);
        }

        console.log('📋 Student ID:', student._id);
        console.log('\n--- BEFORE UPDATE ---');
        console.log('10th School Name:', student.education?.tenth?.schoolName || '(empty)');
        console.log('12th School Name:', student.education?.twelfth?.schoolName || '(empty)');
        console.log('10th Percentage:', student.education?.tenth?.percentage || '(empty)');
        console.log('12th Percentage:', student.education?.twelfth?.percentage || '(empty)');

        // Simulate the update that frontend sends
        const testData = {
            tenth: {
                schoolName: 'Test High School - ' + Date.now(),
                board: 'STATE',
                percentage: 90,
                yearOfPassing: 2018
            },
            twelfth: {
                schoolName: 'Test Higher Secondary - ' + Date.now(),
                board: 'STATE',
                percentage: 89.99,
                yearOfPassing: 2020
            }
        };

        console.log('\n--- UPDATE DATA ---');
        console.log('10th School Name to save:', testData.tenth.schoolName);
        console.log('12th School Name to save:', testData.twelfth.schoolName);

        // Apply the FIXED merge logic with markModified
        if (testData.tenth) {
            student.education.tenth = {
                ...student.education?.tenth,
                ...testData.tenth
            };
            student.markModified('education.tenth');
        }

        if (testData.twelfth) {
            student.education.twelfth = {
                ...student.education?.twelfth,
                ...testData.twelfth
            };
            student.markModified('education.twelfth');
        }

        console.log('\n--- AFTER MERGE (before save) ---');
        console.log('10th School Name:', student.education?.tenth?.schoolName);
        console.log('12th School Name:', student.education?.twelfth?.schoolName);

        // Save to database
        await student.save();
        console.log('\n✅ Saved to database');

        console.log('\n--- AFTER SAVE (in memory) ---');
        console.log('10th School Name:', student.education?.tenth?.schoolName);
        console.log('12th School Name:', student.education?.twelfth?.schoolName);

        // Fetch fresh from database to verify persistence
        const freshStudent = await StudentData.findById(student._id).lean();

        console.log('\n--- FRESH FROM DATABASE ---');
        console.log('10th School Name:', freshStudent.education?.tenth?.schoolName || '(empty)');
        console.log('12th School Name:', freshStudent.education?.twelfth?.schoolName || '(empty)');
        console.log('10th Percentage:', freshStudent.education?.tenth?.percentage);
        console.log('12th Percentage:', freshStudent.education?.twelfth?.percentage);

        // Verify the fix worked
        console.log('\n========================================');
        console.log('VERIFICATION RESULTS');
        console.log('========================================\n');

        const tenthMatch = freshStudent.education?.tenth?.schoolName === testData.tenth.schoolName;
        const twelfthMatch = freshStudent.education?.twelfth?.schoolName === testData.twelfth.schoolName;

        if (tenthMatch && twelfthMatch) {
            console.log('✅ SUCCESS! School names persisted correctly.');
            console.log('   10th School Name: ✓ Matched');
            console.log('   12th School Name: ✓ Matched');
            console.log('\n🎉 The fix is working! School names are now being saved properly.\n');
            process.exit(0);
        } else {
            console.log('❌ FAILED! School names did not persist.');
            if (!tenthMatch) {
                console.log('   10th School Name: ✗ Mismatch');
                console.log('      Expected:', testData.tenth.schoolName);
                console.log('      Got:', freshStudent.education?.tenth?.schoolName);
            }
            if (!twelfthMatch) {
                console.log('   12th School Name: ✗ Mismatch');
                console.log('      Expected:', testData.twelfth.schoolName);
                console.log('      Got:', freshStudent.education?.twelfth?.schoolName);
            }
            console.log('\n⚠️  The fix may not be working correctly.\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testSchoolNamePersistence();
