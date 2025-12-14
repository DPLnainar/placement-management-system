const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    try {
        const envContent = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
        const match = envContent.match(/MONGODB_URI=(.*)/);
        if (match) {
            mongoUri = match[1].trim().replace(/["']/g, '');
            console.log('Found URI manually in .env');
        }
    } catch (e) {
        console.log('Could not read .env file manually');
    }
}

mongoUri = mongoUri || 'mongodb://localhost:27017/placement';
console.log('Connecting to:', mongoUri.includes('@') ? 'Atlas (Remote)' : 'Localhost');

mongoose.connect(mongoUri)
    .then(async () => {
        console.log('Resetting Super Admin Password...');
        const superAdmin = await User.findOne({ role: 'superadmin' });

        if (superAdmin) {
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            superAdmin.password = hashedPassword;
            await superAdmin.save();
            console.log('✅ Password successfully reset to: Admin@123');
        } else {
            console.log('❌ Super Admin NOT found');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
