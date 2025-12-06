require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('Testing MongoDB Atlas connection...');
        console.log('Connection string format:', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//<credentials>@'));

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000
        });

        console.log('\n✅ SUCCESS! MongoDB Atlas connection established');
        console.log('✓ Connected to:', mongoose.connection.host);
        console.log('✓ Database name:', mongoose.connection.name);
        console.log('✓ Connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected');

        await mongoose.connection.close();
        console.log('\n✓ Connection closed successfully');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ FAILED! Could not connect to MongoDB Atlas');
        console.error('Error:', error.message);

        if (error.message.includes('bad auth')) {
            console.error('\n💡 Tip: Check your username and password in the connection string');
            console.error('   Make sure special characters in password are URL-encoded');
        } else if (error.message.includes('ENOTFOUND')) {
            console.error('\n💡 Tip: Check your cluster URL in the connection string');
        } else if (error.message.includes('timed out')) {
            console.error('\n💡 Tip: Check your IP whitelist in MongoDB Atlas Network Access');
        }

        process.exit(1);
    }
}

testConnection();
