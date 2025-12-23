try {
    console.log('Attempting to require server.js...');
    require('./server.js');
} catch (error) {
    console.error('\n--- CAPTURED ERROR ---');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    console.error('----------------------\n');
}
