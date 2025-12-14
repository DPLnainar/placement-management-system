import { College, User, StudentData } from './src/models';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const createStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // 1. Find the college
        const college = await College.findOne({ name: /St\.Joseph/i });
        if (!college) {
            console.error('College not found');
            process.exit(1);
        }
        console.log(`Found College: ${college.name} (${college._id})`);

        // 2. Check/Create User
        const email = 'verify@student.com';
        let user = await User.findOne({ email });

        if (user) {
            console.log('User already exists, updating password if needed...');
            user.password = 'Student123!'; // Trigger hash hook if saved?
            // Force hash manually or rely on save. 
            // Better to delete and recreate to be clean if it's a test user.
            await User.deleteOne({ _id: user._id });
            await StudentData.deleteOne({ userId: user._id });
            console.log('Deleted existing test user.');
        }

        user = await User.create({
            username: 'verifyStudent',
            email,
            password: 'Student123!',
            fullName: 'Verify Student',
            role: 'student',
            collegeId: college._id,
            isActive: true,
            status: 'active'
        });

        // 3. Create Student Profile
        const studentProfile = await StudentData.create({
            userId: user._id,
            collegeId: college._id,
            personal: {
                fullName: user.fullName,
                email: user.email,
                phone: '+91 9988776655', // Pre-fill some data to test "pre-filled" lock behavior
                gender: 'male',
                dob: new Date('2000-01-01')
            }
        });

        // Link profile to user
        user.personalProfileId = studentProfile._id as any;
        user.academicProfileId = studentProfile._id as any;
        await user.save();

        console.log('Student created successfully');
        console.log('Username: verifyStudent');
        console.log('Email: verify@student.com');
        console.log('Password: Student123!');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createStudent();
