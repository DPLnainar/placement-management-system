import { College } from './src/models';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const listColleges = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const colleges = await College.find({}, 'name code city');
        console.log('--- College List ---');
        colleges.forEach(c => {
            console.log(`ID: ${c._id}, Name: ${c.name}, Code: ${c.code}`);
        });
        console.log('--------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listColleges();
