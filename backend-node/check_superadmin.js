require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkSuperAdmin = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const totalUsers = await User.countDocuments();
        console.log(`\nTotal users in database: ${totalUsers}`);

        const superAdmins = await User.find({ role: 'superadmin' });

        if (superAdmins.length > 0) {
            console.log(`\nFound ${superAdmins.length} Super Admin(s):`);
            superAdmins.forEach(admin => {
                console.log(`- Username: ${admin.username}`);
                console.log(`- Email: ${admin.email}`);
                console.log(`- ID: ${admin._id}`);
                console.log('---');
            });
        } else {
            console.log('\nNo Super Admin users found.');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

checkSuperAdmin();
