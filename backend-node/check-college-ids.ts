import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';
import StudentData from './src/models/StudentData';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

async function checkCollegeIds() {
    try {
        // Find the moderator user (niruban)
        const moderator = await User.findOne({ username: 'niruban' });
        if (!moderator) {
            console.log('Moderator "niruban" not found');
            await mongoose.disconnect();
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
            .limit(10);

        console.log('\n=== STUDENTS INFO ===');
        console.log(`Found ${students.length} students`);

        for (const student of students) {
            console.log('\n---');
            console.log('Student ID:', student._id);
            console.log('Username:', student.userId?.username || 'N/A');
            console.log('College ID:', student.collegeId);
            console.log('Department:', student.personal?.branch);
            console.log('Match with moderator college?',
                student.collegeId?.toString() === moderator.collegeId?.toString());
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkCollegeIds();
