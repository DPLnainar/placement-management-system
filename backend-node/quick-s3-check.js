require('dotenv').config();

console.log('\n=== AWS S3 Configuration Check ===\n');

const vars = {
    'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID,
    'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY,
    'AWS_REGION': process.env.AWS_REGION,
    'AWS_S3_BUCKET_NAME': process.env.AWS_S3_BUCKET_NAME,
    'USE_S3': process.env.USE_S3
};

let allSet = true;
for (const [key, value] of Object.entries(vars)) {
    if (value) {
        const displayValue = key.includes('SECRET') ? '***HIDDEN***' : value;
        console.log(`✅ ${key}: ${displayValue}`);
    } else {
        console.log(`❌ ${key}: NOT SET`);
        allSet = false;
    }
}

console.log('\n' + (allSet ? '✅ All AWS S3 variables are configured!' : '❌ Some variables are missing!'));
console.log('\n==================================\n');
