const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const User = mongoose.model('User', userSchema);

const mongoUri = 'mongodb://localhost:27017/placement';

async function resetPassword() {
    try {
        console.log('Connecting to Localhost MongoDB...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connected to Localhost');

        console.log('Resetting Super Admin Password...');
        const superAdmin = await User.findOne({ role: 'superadmin' });

        if (superAdmin) {
            console.log('Found Super Admin:', superAdmin.username);
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            superAdmin.password = hashedPassword;
            await superAdmin.save();
            console.log('✅ Password successfully reset to: Admin@123 (LOCAL)');
        } else {
            console.log('❌ Super Admin NOT found in Local DB');
            // Create user
            console.log('Creating Super Admin in Local DB...');
            await User.create({
                username: 'superadmin',
                email: 'superadmin@system.com',
                password: await bcrypt.hash('Admin@123', 10),
                role: 'superadmin',
                status: 'active',
                isApproved: true,
                isActive: true
            });
            console.log('✅ Super Admin Created in Local DB');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetPassword();
