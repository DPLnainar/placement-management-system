/**
 * Migration Script: Fix Admin Users CollegeId
 * 
 * This script updates all admin users who don't have a collegeId set.
 * It assigns them to the first available college in the database.
 * 
 * Run this script once to fix existing data:
 * npx ts-node src/scripts/fixAdminCollegeId.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, College } from '../models/index';

dotenv.config();

async function fixAdminCollegeId() {
    try {
        // Connect to database
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/placement-portal';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find all admin users without collegeId
        const adminsWithoutCollege = await User.find({
            role: 'admin',
            $or: [
                { collegeId: null },
                { collegeId: { $exists: false } }
            ]
        });

        console.log(`Found ${adminsWithoutCollege.length} admin users without collegeId`);

        if (adminsWithoutCollege.length === 0) {
            console.log('✅ All admin users already have collegeId set');
            process.exit(0);
        }

        // Get the first college (or create one if none exists)
        let college = await College.findOne();

        if (!college) {
            console.log('⚠️  No colleges found. Creating a default college...');
            college = await College.create({
                name: 'Default College',
                code: 'DEFAULT',
                location: 'Unknown',
                establishedYear: new Date().getFullYear(),
                contactEmail: 'admin@college.edu',
                contactPhone: '0000000000',
                isActive: true,
            });
            console.log(`✅ Created default college: ${college.name} (ID: ${college._id})`);
        }

        // Update all admin users
        let updatedCount = 0;
        for (const admin of adminsWithoutCollege) {
            admin.collegeId = college._id as any;
            await admin.save();
            updatedCount++;
            console.log(`✅ Updated admin: ${admin.username} (${admin.email}) -> College: ${college.name}`);
        }

        console.log(`\n✅ Successfully updated ${updatedCount} admin users`);
        console.log(`All admins are now associated with: ${college.name} (ID: ${college._id})`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
fixAdminCollegeId();
