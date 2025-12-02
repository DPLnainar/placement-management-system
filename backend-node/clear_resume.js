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
    
    console.log('\n=== CLEARING OLD RESUME ===');
    
    // Clear resume from user
    user.resumeFile = '';
    user.resumePublicId = '';
    user.resumeUploadedAt = null;
    await user.save();
    
    console.log('✅ Resume cleared from database');
    console.log('📝 Ready to upload new resume');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}, 500);
