// Quick test to verify colleges API is working
const axios = require('axios');

console.log('Testing colleges API...\n');

axios.get('http://localhost:8000/api/public/colleges')
  .then(response => {
    console.log('✅ API Response Success!\n');
    console.log('Status:', response.status);
    console.log('Data structure:', response.data);

    const colleges = response.data.data || response.data;
    console.log(`\nFound ${colleges.length} colleges:\n`);

    colleges.forEach((college, index) => {
      console.log(`${index + 1}. ${college.name} (${college.code})`);
      console.log(`   Location: ${college.location}`);
      console.log(`   ID: ${college._id}\n`);
    });

    console.log('✨ College dropdown should now work on login page!');
  })
  .catch(error => {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  });
