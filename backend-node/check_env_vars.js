
require('dotenv').config();

console.log('Checking Environment Variables...');
console.log('PORT:', process.env.PORT);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'MISSING');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'MISSING');
console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME ? 'SET' : 'MISSING');
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET ? 'SET' : 'MISSING');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'MISSING (will default to localhost)');
