const mongoose = require('mongoose');

const mongoUri = 'mongodb://localhost:27017/placement';

const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const User = mongoose.model('User', userSchema);

async function unlockAndVerify() {
    try {
        console.log('Connecting to Localhost MongoDB...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

        console.log('Unlocking Super Admin...');
        const result = await User.updateOne(
            { role: 'superadmin' },
            {
                $set: {
                    failedAttempts: 0, // Corrected from loginAttempts
                    accountLockedUntil: undefined // Corrected from lockUntil
                },
                $unset: { accountLockedUntil: 1, lockUntil: 1 } // Remove both just in case
            }
        );

        console.log('Update result:', result);

        const user = await User.findOne({ role: 'superadmin' });
        console.log('\nVerification:');
        console.log('Username:', user.username);
        console.log('Login Attempts (Failed):', user.failedAttempts);
        console.log('Account Locked Until:', user.accountLockedUntil);

        if (!user.accountLockedUntil && (user.failedAttempts === 0 || !user.failedAttempts)) {
            console.log('\n✅ ACCOUNT IS UNLOCKED');
        } else {
            console.log('\n❌ ACCOUNT IS STILL LOCKED');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

unlockAndVerify();
