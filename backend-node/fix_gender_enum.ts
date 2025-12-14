import mongoose from 'mongoose';
import StudentData from './src/models/StudentData';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const fixGenderEnum = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // Find all students with capitalized gender values
        const students = await StudentData.find({
            'personal.gender': { $in: ['Male', 'Female', 'Other'] }
        });

        console.log(`Found ${students.length} students with capitalized gender`);

        for (const student of students) {
            const oldGender = student.personal.gender;
            if (oldGender === 'Male') student.personal.gender = 'male';
            else if (oldGender === 'Female') student.personal.gender = 'female';
            else if (oldGender === 'Other') student.personal.gender = 'other';

            await student.save();
            console.log(`Fixed gender for student ${student.userId}: ${oldGender} -> ${student.personal.gender}`);
        }

        console.log('All gender values fixed!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixGenderEnum();
