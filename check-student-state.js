const mongoose = require('mongoose');

const mongoURI = 'mongodb+srv://ganesh:ganesh123@cluster0.p71v5.mongodb.net/placement-management-system?retryWrites=true&w=majority';

// Define Schemas
const UserSchema = new mongoose.Schema({}, { strict: false });
const StudentDataSchema = new mongoose.Schema({}, { strict: false, collection: 'studentdatas' });

const User = mongoose.model('UserCheck', UserSchema, 'users');
const StudentData = mongoose.model('StudentCheck', StudentDataSchema, 'studentdatas');

async function checkStudent(username) {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username });
        if (!user) {
            console.log(`User ${username} not found`);
            return;
        }

        console.log('\n--- User Profile ---');
        console.log('ID:', user._id);
        console.log('Role:', user.role);
        console.log('Status:', user.status);
        console.log('Is Approved:', user.isApproved);
        console.log('Is Active:', user.isActive);

        const student = await StudentData.findOne({ userId: user._id });
        if (!student) {
            console.log(`Student data for ${username} not found`);
            return;
        }

        console.log('\n--- Student Data ---');
        console.log('ID:', student._id);
        console.log('Verification Status:', student.verificationStatus);
        console.log('Is Profile Completed:', student.isProfileCompleted);
        console.log('Mandatory Fields Completed:', student.mandatoryFieldsCompleted);

        console.log('\n--- Mandatory Fields Check ---');
        if (student.personal) {
            console.log('Name:', student.personal.name);
            console.log('Email:', student.personal.email);
            console.log('Phone:', student.personal.phone);
            console.log('DOB:', student.personal.dob);
            console.log('Gender:', student.personal.gender);
        } else {
            console.log('Personal info object missing');
        }

        if (student.education) {
            console.log('10th %:', student.education.tenth?.percentage);
            console.log('12th %:', student.education.twelfth?.percentage);
            console.log('Graduation CGPA:', student.education.graduation?.cgpa);
        } else {
            console.log('Education info object missing');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

const targetUsername = process.argv[2] || 'ganesh';
checkStudent(targetUsername);
