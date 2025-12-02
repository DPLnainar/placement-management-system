const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

setTimeout(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    
    const user = await User.findOne({ username: 'ganesh' });
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('\n=== GANESH USER RESUME INFO ===\n');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Resume File URL:', user.resumeFile || 'NOT UPLOADED');
    console.log('Resume Public ID:', user.resumePublicId || 'NOT UPLOADED');
    console.log('Resume Uploaded At:', user.resumeUploadedAt || 'NOT UPLOADED');
    
    if (!user.resumeFile) {
      console.log('\n❌ NO RESUME UPLOADED for ganesh');
    } else {
      console.log('\n✅ RESUME FOUND:');
      console.log('URL:', user.resumeFile);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}, 500);
