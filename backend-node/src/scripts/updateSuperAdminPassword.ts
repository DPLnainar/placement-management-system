import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../config/database';

/**
 * Update Super Admin Password
 * Changes the super admin password to 'superadmin'
 */
async function updateSuperAdminPassword() {
    try {
        // Connect to database
        await connectDB();
        console.log('✓ Connected to database');

        // Find super admin user
        const superAdmin = await User.findOne({ role: 'superadmin', username: 'superadmin' });

        if (!superAdmin) {
            console.log('❌ Super admin user not found!');
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log('✓ Found super admin user');

        // Update password (will be hashed by pre-save hook)
        superAdmin.password = 'superadmin';
        await superAdmin.save();

        console.log('\n✅ Super Admin password updated successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 New Login Credentials:');
        console.log('   Username: superadmin');
        console.log('   Password: superadmin');
        console.log('   Email: superadmin@system.com');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error updating password:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the update function
updateSuperAdminPassword();
