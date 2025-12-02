const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/public/colleges',
  method: 'GET'
};

console.log('Sending request to http://localhost:8000/api/public/colleges');

const req = http.request(options, (res) => {
  console.log('Response received!');
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
  process.exit(1);
});

req.end();

// Timeout after 5 seconds
setTimeout(() => {
  console.error('Request timeout');
  process.exit(1);
}, 5000);
