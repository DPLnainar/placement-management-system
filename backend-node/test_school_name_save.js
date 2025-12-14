const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Import models
const StudentData = require('./models/StudentData');

async function testSchoolNameSave() {
    try {
        // Find the first student
        let student = await StudentData.findOne({});

        if (!student) {
            console.log('No student found in database');
            return;
        }

        console.log('\n=== BEFORE UPDATE ===');
        console.log('10th schoolName:', student.education?.tenth?.schoolName);
        console.log('12th schoolName:', student.education?.twelfth?.schoolName);
        console.log('10th percentage:', student.education?.tenth?.percentage);

        // Simulate the update that frontend sends
        const updateData = {
            education: {
                tenth: {
                    schoolName: 'Test High School',
                    board: 'STATE',
                    percentage: 90,
                    yearOfPassing: 2018
                },
                twelfth: {
                    schoolName: 'Test Higher Secondary',
                    board: 'STATE',
                    percentage: 89.99,
                    yearOfPassing: 2020
                }
            }
        };

        console.log('\n=== UPDATE DATA ===');
        console.log('10th schoolName to save:', updateData.education.tenth.schoolName);
        console.log('12th schoolName to save:', updateData.education.twelfth.schoolName);

        // Apply the same merge logic as backend
        if (updateData.education) {
            student.education = {
                ...student.education,
                ...updateData.education,
                tenth: { ...student.education?.tenth, ...updateData.education?.tenth },
                twelfth: { ...student.education?.twelfth, ...updateData.education?.twelfth },
                graduation: { ...student.education?.graduation, ...updateData.education?.graduation }
            };
        }

        console.log('\n=== AFTER MERGE (before save) ===');
        console.log('10th schoolName:', student.education?.tenth?.schoolName);
        console.log('12th schoolName:', student.education?.twelfth?.schoolName);

        await student.save();

        console.log('\n=== AFTER SAVE ===');
        console.log('10th schoolName:', student.education?.tenth?.schoolName);
        console.log('12th schoolName:', student.education?.twelfth?.schoolName);

        // Fetch fresh from database
        const freshStudent = await StudentData.findById(student._id);
        console.log('\n=== FRESH FROM DB ===');
        console.log('10th schoolName:', freshStudent.education?.tenth?.schoolName);
        console.log('12th schoolName:', freshStudent.education?.twelfth?.schoolName);
        console.log('10th percentage:', freshStudent.education?.tenth?.percentage);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testSchoolNameSave();
