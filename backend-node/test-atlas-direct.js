const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

console.log('Testing MongoDB Atlas connection...\n');
console.log('Cluster:', mongoUri?.match(/@([^/]+)/)?.[1] || 'unknown');

mongoose.connect(mongoUri)
    .then(() => {
        console.log('\n✅ SUCCESS! Connected to MongoDB Atlas');
        console.log('Database:', mongoose.connection.name);
        console.log('Host:', mongoose.connection.host);
        process.exit(0);
    })
    .catch((error) => {
        console.log('\n❌ FAILED to connect to MongoDB Atlas\n');
        console.log('Error:', error.message);

        if (error.message.includes('authentication')) {
            console.log('\n🔍 Possible causes:');
            console.log('  - Incorrect username or password');
            console.log('  - Password contains special characters that need URL encoding');
            console.log('  - Database user not created in Atlas');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.log('\n🔍 Possible causes:');
            console.log('  - Incorrect cluster URL');
            console.log('  - Network connectivity issues');
            console.log('  - Cluster is paused or deleted');
        } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
            console.log('\n🔍 Possible causes:');
            console.log('  - Your IP address is not whitelisted in Atlas Network Access');
            console.log('  - Add 0.0.0.0/0 to allow access from anywhere (for testing)');
        }

        process.exit(1);
    });

// Timeout after 10 seconds
setTimeout(() => {
    console.log('\n⏱️  Connection timeout - taking too long to connect');
    process.exit(1);
}, 10000);
