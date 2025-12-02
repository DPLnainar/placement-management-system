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
const College = require('../models/College');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Check Users
        const totalUsers = await User.countDocuments();
        console.log('Total Users:', totalUsers);

        const roles = ['superadmin', 'admin', 'moderator', 'student'];
        for (const role of roles) {
            const count = await User.countDocuments({ role });
            console.log(role + ':', count);
            if (role === 'student' && count > 0) {
                const student = await User.findOne({ role: 'student' });
                // Print relevant profile fields
                const details = {
                    username: student.username,
                    email: student.email,
                    tenthInstitution: student.tenthInstitution,
                    twelfthInstitution: student.twelfthInstitution,
                    cgpa: student.cgpa,
                    skills: student.skills,
                    internships: student.internships
                };
                console.log('Student Details (User Model):', JSON.stringify(details, null, 2));
            }
        }

        // Check StudentData
        const totalStudentData = await StudentData.countDocuments();
        console.log('Total StudentData:', totalStudentData);

        // Check Colleges
        const totalColleges = await College.countDocuments();
        console.log('Total Colleges:', totalColleges);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed');
    }
};

checkData();
