require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const User = mongoose.model('User', userSchema);

const mongoUri = process.env.MONGODB_URI;

mongoose.connect(mongoUri)
    .then(async () => {
        console.log('Unlocking Super Admin account...');

        const result = await User.updateOne(
            { role: 'superadmin' },
            {
                $set: {
                    loginAttempts: 0,
                    lockUntil: null
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log('✅ Account successfully unlocked!');
        } else {
            console.log('⚠️ No account needed unlocking (or superadmin not found)');
        }

        // Double check
        const user = await User.findOne({ role: 'superadmin' });
        console.log('Current Login Attempts:', user?.loginAttempts);
        console.log('Lock Until:', user?.lockUntil);

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
