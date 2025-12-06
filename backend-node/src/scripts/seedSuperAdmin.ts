import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../config/database';

/**
 * Seed Super Admin User
 * Creates a super admin account if it doesn't exist
 */
async function seedSuperAdmin() {
    try {
        // Connect to database
        await connectDB();
        console.log('✓ Connected to database');

        // Check if super admin already exists
        const existingAdmin = await User.findOne({ role: 'superadmin' });

        if (existingAdmin) {
            console.log('⚠️  Super admin already exists:');
            console.log(`   Username: ${existingAdmin.username}`);
            console.log(`   Email: ${existingAdmin.email}`);
            await mongoose.connection.close();
            process.exit(0);
        }

        // Create super admin user
        const superAdmin = await User.create({
            username: 'superadmin',
            email: 'superadmin@system.com',
            password: 'SuperAdmin123!', // Will be hashed by pre-save hook
            fullName: 'Super Administrator',
            role: 'superadmin',
            status: 'active',
            isActive: true,
            isApproved: true,
            phone: '+1234567890'
        });

        console.log('\n✅ Super Admin created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Login Credentials:');
        console.log('   Username: superadmin');
        console.log('   Password: SuperAdmin123!');
        console.log('   Email: superadmin@system.com');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding super admin:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the seed function
seedSuperAdmin();
