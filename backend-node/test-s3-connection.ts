import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testS3Connection() {
    console.log('🔍 Testing AWS S3 Connection...\n');

    // Display configuration (without showing full secret key)
    console.log('📋 Configuration:');
    console.log(`   Region: ${process.env.AWS_REGION}`);
    console.log(`   Bucket: ${process.env.AWS_S3_BUCKET_NAME}`);
    console.log(`   Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 10)}...`);
    console.log(`   Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? '***configured***' : 'NOT SET'}\n`);

    // Check if credentials are set
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error('❌ AWS credentials not found in environment variables');
        console.error('   Please check your .env file');
        return;
    }

    // Create S3 client
    const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    try {
        console.log('🔄 Attempting to list S3 buckets...');
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);

        console.log('\n✅ S3 Connection Successful!\n');
        console.log('📦 Available Buckets:');
        if (response.Buckets && response.Buckets.length > 0) {
            response.Buckets.forEach((bucket, index) => {
                const isTargetBucket = bucket.Name === process.env.AWS_S3_BUCKET_NAME;
                const marker = isTargetBucket ? '✓' : ' ';
                console.log(`   [${marker}] ${bucket.Name}`);
            });
        } else {
            console.log('   No buckets found');
        }

        // Check if target bucket exists
        const targetBucket = process.env.AWS_S3_BUCKET_NAME;
        const bucketExists = response.Buckets?.some(b => b.Name === targetBucket);

        if (bucketExists) {
            console.log(`\n✅ Target bucket "${targetBucket}" found!`);
        } else {
            console.log(`\n⚠️  Target bucket "${targetBucket}" NOT found!`);
            console.log('   You may need to create this bucket in AWS S3 console');
        }

    } catch (error: any) {
        console.error('\n❌ S3 Connection Failed!\n');
        console.error('Error Details:');
        console.error(`   Code: ${error.Code || error.name}`);
        console.error(`   Message: ${error.message}`);

        if (error.Code === 'InvalidAccessKeyId') {
            console.error('\n💡 Suggestion: Check if your AWS_ACCESS_KEY_ID is correct');
        } else if (error.Code === 'SignatureDoesNotMatch') {
            console.error('\n💡 Suggestion: Check if your AWS_SECRET_ACCESS_KEY is correct');
        } else if (error.Code === 'InvalidClientTokenId') {
            console.error('\n💡 Suggestion: Your access key may be invalid or deactivated');
        }
    }
}

// Run the test
testS3Connection();
