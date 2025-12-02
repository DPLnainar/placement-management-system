const mongoose = require('mongoose');
const path = require('path');

// Try loading from default location (current dir) first
let result = require('dotenv').config();
if (result.error) {
    // Try explicit path
    result = require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

if (!process.env.MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI is not defined.');
    process.exit(1);
}

const User = require('../models/User');
const StudentData = require('../models/StudentData');

const repairData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} students.`);

        for (const student of students) {
            const existingData = await StudentData.findOne({ userId: student._id });
            if (!existingData) {
                console.log(`Missing StudentData for ${student.username}. Creating...`);
                const newData = new StudentData({
                    userId: student._id,
                    collegeId: student.collegeId,
                    documentsVerified: false,
                    placementStatus: 'not_placed'
                });
                await newData.save();
                console.log('Created.');
            } else {
                console.log(`StudentData exists for ${student.username}.`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed');
    }
};

repairData();
