require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const User = mongoose.model('User', userSchema);

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement';

mongoose.connect(mongoUri)
    .then(async () => {
        console.log('Checking Super Admin...');
        const superAdmin = await User.findOne({ role: 'superadmin' });

        if (superAdmin) {
            console.log('✅ Super Admin found:');
            console.log('Username:', superAdmin.username);
            console.log('Email:', superAdmin.email);

            // Check password
            const isMatch = await bcrypt.compare('Admin@123', superAdmin.password);
            console.log('Password Match (Admin@123):', isMatch);
        } else {
            console.log('❌ Super Admin NOT found');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
