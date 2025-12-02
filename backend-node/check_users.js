const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const College = require('./models/College');

setTimeout(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    
    console.log('\n=== ALL USERS IN DATABASE ===\n');
    const users = await User.find().populate('collegeId', 'name').select('username email role status');
    
    if (users.length === 0) {
      console.log('No users found. Run: npm run seed');
    } else {
      users.forEach(u => {
        const college = u.collegeId?.name || 'None';
        console.log(`${u.username} | ${u.email} | ${u.role} | ${u.status} | College: ${college}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}, 500);
