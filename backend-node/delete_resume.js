const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const { deleteFile } = require('./config/fileUpload');

setTimeout(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    
    const user = await User.findOne({ username: 'ganesh' });
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('\n=== DELETING OLD RESUME ===\n');
    console.log('Current resume:', user.resumeFile);
    console.log('Public ID:', user.resumePublicId);
    
    if (user.resumePublicId) {
      try {
        // Delete from Cloudinary - use auto resource type since it was image
        await deleteFile(user.resumePublicId, 'auto');
        console.log('✅ Deleted from Cloudinary');
      } catch (err) {
        console.log('⚠️ Error deleting from Cloudinary:', err.message);
      }
    }
    
    // Clear resume from user
    user.resumeFile = '';
    user.resumePublicId = '';
    user.resumeUploadedAt = null;
    await user.save();
    
    console.log('✅ Cleared resume from database');
    console.log('\n📝 Now upload a new resume - it will use raw resource type (better for PDFs)');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}, 500);
