const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const testS3Upload = async () => {
    try {
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });

        const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;

        console.log('Testing S3 upload...');
        console.log('Bucket:', bucketName);
        console.log('Region:', process.env.AWS_REGION || 'us-east-1');

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: 'test-upload.txt',
            Body: Buffer.from('Test upload from backend'),
            ContentType: 'text/plain',
        });

        await s3Client.send(command);
        console.log('✅ S3 upload successful!');
    } catch (error) {
        console.error('❌ S3 upload failed:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
    }
};

testS3Upload();
