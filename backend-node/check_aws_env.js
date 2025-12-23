require('dotenv').config();

console.log('Checking AWS Configuration:');
console.log('AWS_REGION:', process.env.AWS_REGION ? 'Set' : 'Missing');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Missing');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Missing');
console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME ? 'Set' : 'Missing');
