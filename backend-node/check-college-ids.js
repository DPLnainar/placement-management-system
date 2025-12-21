const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const User = require('./src/models/User');
const StudentData = require('./src/models/StudentData');

async function checkCollegeIds() {
    try {
        // Find the moderator user (niruban)
        const moderator = await User.findOne({ username: 'niruban' });
        if (!moderator) {
            console.log('Moderator "niruban" not found');
            return;
        }

        console.log('\n=== MODERATOR INFO ===');
        console.log('Username:', moderator.username);
        console.log('College ID:', moderator.collegeId);
        console.log('Department:', moderator.department);
        console.log('Role:', moderator.role);

        // Find all students
        const students = await StudentData.find({})
            .populate('userId', 'username fullName')
            .limit(5);

        console.log('\n=== STUDENTS INFO ===');
        for (const student of students) {
            console.log('\nStudent:', student.userId?.username || 'N/A');
            console.log('  College ID:', student.collegeId);
            console.log('  Department:', student.personal?.branch);
            console.log('  Match with moderator college?',
                student.collegeId?.toString() === moderator.collegeId?.toString());
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCollegeIds();
