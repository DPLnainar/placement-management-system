require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const User = mongoose.model('User', userSchema);

async function resetPassword() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        // Use the URI from env
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        console.log('URI found (masked):', mongoUri.replace(/\/\/.*@/, '//<credentials>@'));

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000
        });

        console.log('✅ Connected to MongoDB Atlas');

        console.log('Resetting Super Admin Password...');
        const superAdmin = await User.findOne({ role: 'superadmin' });

        if (superAdmin) {
            console.log('Found Super Admin:', superAdmin.username);
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            superAdmin.password = hashedPassword;
            await superAdmin.save();
            console.log('✅ Password successfully reset to: Admin@123');
        } else {
            console.log('❌ Super Admin NOT found');
            // Create if missing? optional
            console.log('Creating Super Admin...');
            await User.create({
                username: 'superadmin',
                email: 'superadmin@system.com',
                password: await bcrypt.hash('Admin@123', 10),
                role: 'superadmin',
                status: 'active',
                isApproved: true,
                isActive: true
            });
            console.log('✅ Super Admin Created');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetPassword();
