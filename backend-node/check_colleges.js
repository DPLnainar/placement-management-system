const mongoose = require('mongoose');
require('dotenv').config();
const College = require('./models/College');

setTimeout(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    
    console.log('\n=== ALL COLLEGES IN DATABASE ===\n');
    const colleges = await College.find().select('_id name code location status');
    
    colleges.forEach(c => {
      console.log(`ID: ${c._id} | Name: ${c.name} | Code: ${c.code}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}, 500);
