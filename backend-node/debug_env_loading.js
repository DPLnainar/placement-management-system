const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);

if (fs.existsSync(envPath)) {
    console.log('.env file exists.');
    const envConfig = dotenv.config();

    if (envConfig.error) {
        console.log('Error loading .env:', envConfig.error);
    } else {
        console.log('Parsed .env keys:', Object.keys(envConfig.parsed || {}));
        console.log('AWS_BUCKET_NAME value type:', typeof process.env.AWS_BUCKET_NAME);
        if (process.env.AWS_BUCKET_NAME) {
            console.log('AWS_BUCKET_NAME length:', process.env.AWS_BUCKET_NAME.length);
        }
    }
} else {
    console.log('.env file does NOT exist at path.');
}
