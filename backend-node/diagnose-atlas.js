const fs = require('fs');
const path = require('path');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

console.log('\n=== MongoDB Atlas Connection Diagnostics ===\n');

if (!mongoUri) {
    console.log('❌ MONGODB_URI is not set in .env file');
    process.exit(1);
}

if (!mongoUri.startsWith('mongodb+srv://')) {
    console.log('⚠️  Not using MongoDB Atlas (mongodb+srv://)');
    console.log('Current URI format:', mongoUri.substring(0, 20) + '...');
    process.exit(1);
}

// Parse the connection string (without revealing the full password)
const uriParts = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/);

if (!uriParts) {
    console.log('❌ Invalid MongoDB Atlas connection string format');
    console.log('Expected format: mongodb+srv://username:password@cluster-url/database');
    process.exit(1);
}

const [, username, password, clusterUrl, database] = uriParts;

console.log('✓ Connection string format is valid');
console.log('\nConnection Details:');
console.log('  Username:', username);
console.log('  Password:', password.substring(0, 3) + '*'.repeat(password.length - 3));
console.log('  Cluster URL:', clusterUrl);
console.log('  Database:', database);

// Check for common issues
console.log('\n=== Common Issues Checklist ===\n');

if (password.includes('@') || password.includes(':') || password.includes('/')) {
    console.log('⚠️  WARNING: Password contains special characters that may need URL encoding');
    console.log('   Special characters found:', password.match(/[@:\/]/g)?.join(', '));
    console.log('   Make sure these are URL-encoded in your .env file');
}

if (!clusterUrl.includes('.mongodb.net')) {
    console.log('⚠️  WARNING: Cluster URL doesn\'t look like a standard Atlas URL');
}

console.log('\n=== Next Steps ===\n');
console.log('1. Verify your MongoDB Atlas cluster is running');
console.log('2. Check Network Access in Atlas - add your IP: 0.0.0.0/0 (for testing)');
console.log('3. Verify database user credentials in Atlas');
console.log('4. Ensure password special characters are URL-encoded');
console.log('\nAttempting connection test...\n');
