import { College, User, Moderator } from './src/models';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // 1. Find the college to keep
        // User said "sjce", screenshot showed "St.Joseph's College of Enginnering"
        const keeperPattern = /St\.Joseph|sjce/i;
        const keptCollege = await College.findOne({ name: keeperPattern });

        if (!keptCollege) {
            console.error('CRITICAL: Could not find the college to keep (St.Joseph/sjce)! Aborting cleanup to prevent data loss.');
            const all = await College.find({}, 'name');
            console.log('Available colleges:', all.map(c => c.name));
            process.exit(1);
        }

        console.log(`KEEPING College: ${keptCollege.name} (ID: ${keptCollege._id})`);

        // 2. Delete other colleges
        const deleteCollegesResult = await College.deleteMany({ _id: { $ne: keptCollege._id } });
        console.log(`Deleted ${deleteCollegesResult.deletedCount} other colleges.`);

        // 3. Delete users associated with other colleges
        // BE CAREFUL: Do not delete SuperAdmin. SuperAdmin usually has no collegeId or a specific one.
        // We will delete users where collegeId is NOT the kept ID, AND role is NOT superadmin.
        const deleteUsersResult = await User.deleteMany({
            collegeId: { $ne: keptCollege._id },
            role: { $ne: 'superadmin' }
        });
        console.log(`Deleted ${deleteUsersResult.deletedCount} users from other colleges.`);

        // 4. Delete moderators associated with other colleges
        const deleteModsResult = await Moderator.deleteMany({ collegeId: { $ne: keptCollege._id } });
        console.log(`Deleted ${deleteModsResult.deletedCount} moderator profiles from other colleges.`);

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanup();
