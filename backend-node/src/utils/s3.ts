import { S3Client } from '@aws-sdk/client-s3';

// AWS S3 Configuration
export const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || '';

// Validate S3 configuration
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
    console.warn('⚠️  AWS S3 credentials not configured. File uploads may fail.');
    console.warn('Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET in your .env file');
}
