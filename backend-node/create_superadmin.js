require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const userData = {
            username: 'superadmin',
            email: 'superadmin@pms.com',
            password: 'superadmin123',
            fullName: 'Ganeshkumar',
            role: 'superadmin',
            status: 'active',
            isApproved: true,
            // SuperAdmin doesn't need collegeId, but schema might require it if not handled carefully.
            // Looking at User.js: collegeId required function returns true if role !== 'superadmin'.
            // So we don't need collegeId.
        };

        const user = await User.create(userData);
        console.log(`\nSuper Admin created successfully:`);
        console.log(`- Username: ${user.username}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- ID: ${user._id}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(`Error creating Super Admin: ${error.message}`);
        // If it's a validation error, log more details
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`- ${key}: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

createSuperAdmin();
