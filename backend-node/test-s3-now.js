require('dotenv').config();
const { S3Client, HeadBucketCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;

console.log('\n=== AWS S3 Connection Test ===\n');
console.log('Region:', process.env.AWS_REGION);
console.log('Bucket:', bucketName);
console.log('Access Key:', process.env.AWS_ACCESS_KEY_ID?.substring(0, 10) + '...');
console.log('\nTesting connection...\n');

async function testS3() {
    try {
        // Test 1: Check if bucket exists and is accessible
        console.log('1. Checking bucket access...');
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log('   ✅ Bucket exists and is accessible\n');

        // Test 2: Try to upload a test file
        console.log('2. Testing file upload...');
        const testKey = `test/connection-test-${Date.now()}.txt`;
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: 'S3 connection test successful!',
            ContentType: 'text/plain',
        }));
        console.log('   ✅ File upload successful\n');

        console.log('=== ✅ ALL TESTS PASSED ===\n');
        console.log('AWS S3 is properly configured and ready to use!');
        console.log('Backend server can now upload files to S3.\n');

        process.exit(0);
    } catch (error) {
        console.log('\n=== ❌ CONNECTION FAILED ===\n');
        console.log('Error:', error.message);

        if (error.name === 'NoSuchBucket') {
            console.log('\n🔍 Issue: Bucket does not exist');
            console.log('Solution: Create the bucket in AWS S3 console or verify the bucket name');
        } else if (error.name === 'InvalidAccessKeyId') {
            console.log('\n🔍 Issue: Invalid Access Key ID');
            console.log('Solution: Verify AWS_ACCESS_KEY_ID in .env file');
        } else if (error.name === 'SignatureDoesNotMatch') {
            console.log('\n🔍 Issue: Invalid Secret Access Key');
            console.log('Solution: Verify AWS_SECRET_ACCESS_KEY in .env file');
        } else if (error.name === 'AccessDenied') {
            console.log('\n🔍 Issue: Access denied to bucket');
            console.log('Solution: Check IAM user permissions (needs S3 access)');
        }

        process.exit(1);
    }
}

testS3();
