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

async function debugStudentData() {
    try {
        // Find the first student
        const student = await StudentData.findOne({}).lean();

        if (!student) {
            console.log('No student found in database');
            return;
        }

        console.log('\n=== STUDENT DATA DEBUG ===');
        console.log('Student ID:', student._id);
        console.log('\n--- Education Object ---');
        console.log('Full education object:', JSON.stringify(student.education, null, 2));
        console.log('\n--- 10th Details ---');
        console.log('10th object:', student.education?.tenth);
        console.log('10th schoolName:', student.education?.tenth?.schoolName);
        console.log('10th institution:', student.education?.tenth?.institution);
        console.log('10th percentage:', student.education?.tenth?.percentage);
        console.log('\n--- 12th Details ---');
        console.log('12th object:', student.education?.twelfth);
        console.log('12th schoolName:', student.education?.twelfth?.schoolName);
        console.log('12th institution:', student.education?.twelfth?.institution);
        console.log('12th percentage:', student.education?.twelfth?.percentage);

        console.log('\n--- Personal Info ---');
        console.log('Full Name:', student.personal?.fullName);
        console.log('Name:', student.personal?.name);
        console.log('First Name:', student.personal?.firstName);
        console.log('Last Name:', student.personal?.lastName);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugStudentData();
