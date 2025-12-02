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

const dumpStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const student = await User.findOne({ role: 'student' });
        if (student) {
            console.log('FULL STUDENT OBJECT DUMP:');
            console.log(JSON.stringify(student.toObject(), null, 2));
        } else {
            console.log('No student found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed');
    }
};

dumpStudent();
