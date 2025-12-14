import { User, StudentData } from './src/models';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const cleanupStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const email = 'verify@student.com';

        await User.deleteOne({ email });
        // Also delete by username just in case
        await User.deleteOne({ username: 'verifyStudent' });

        // Delete student data
        // We need userId first but we just deleted user. 
        // We can delete studentData where personal.email matches.
        await StudentData.deleteOne({ 'personal.email': email });

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanupStudent();
