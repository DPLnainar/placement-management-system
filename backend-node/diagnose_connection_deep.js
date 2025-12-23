require('dotenv').config();
const mongoose = require('mongoose');

async function diagnose() {
    const uri = process.env.MONGODB_URI;
    console.log('--- Diagnostic Start ---');
    console.log('URI loaded:', uri ? 'Yes' : 'No');
    if (uri) {
        // Obfuscate password for log
        console.log('URI format:', uri.replace(/:([^:@]+)@/, ':****@'));
    }

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected successfully!');
    } catch (err) {
        console.log('--- Connection Error ---');
        console.log('Name:', err.name);
        console.log('Message:', err.message);
        console.log('Code:', err.code);
        console.log('CodeName:', err.codeName);
        console.log('Syscall:', err.syscall);
        console.log('Hostname:', err.hostname);

        if (err.reason) {
            console.log('Reason:', JSON.stringify(err.reason, null, 2));
        }
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
