const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs');

setTimeout(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    
    const user = await User.findOne({
      $or: [
        { username: 'ganesh' },
        { email: 'ganesh' }
      ]
    }).select('+password');
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('\n=== USER FOUND ===');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Password hash exists:', !!user.password);
    console.log('Password hash:', user.password?.substring(0, 30) + '...');
    
    // Test with common passwords
    const testPasswords = ['ganesh', 'ganesh123', 'password', '123456'];
    
    console.log('\n=== TESTING PASSWORDS ===');
    for (const pwd of testPasswords) {
      const isMatch = await bcrypt.compare(pwd, user.password);
      console.log(`Password "${pwd}": ${isMatch ? 'MATCH' : 'NO MATCH'}`);
    }
    
    // Also test the user's comparePassword method
    console.log('\n=== USING USER METHOD ===');
    for (const pwd of testPasswords) {
      const isMatch = await user.comparePassword(pwd);
      console.log(`Password "${pwd}" (via method): ${isMatch ? 'MATCH' : 'NO MATCH'}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}, 500);
