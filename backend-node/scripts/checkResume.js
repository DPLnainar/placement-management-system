require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Find students with resume
  const students = await User.find({ role: 'student' }).limit(5);
  console.log('Found', students.length, 'students');
  
  for (const student of students) {
    console.log('\n--- Student:', student.fullName || student.username);
    console.log('Email:', student.email);
    console.log('resumeFile:', student.resumeFile || 'NOT SET');
    console.log('resumePublicId:', student.resumePublicId || 'NOT SET');
    console.log('resumeLink:', student.resumeLink || 'NOT SET');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
