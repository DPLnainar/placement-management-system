/**
 * List All Users - Diagnostic Script
 * List all users to find the moderator
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/placement-portal');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const listUsers = async () => {
    try {
        const db = mongoose.connection.db;

        // Find all users
        const users = await db.collection('users').find({}).toArray();

        console.log('\n=== ALL USERS ===');
        console.log(`Found ${users.length} users\n`);

        for (const user of users) {
            console.log('---');
            console.log('Username:', user.username);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('College ID:', user.collegeId);
            console.log('Department:', user.department);
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

connectDB().then(listUsers);
