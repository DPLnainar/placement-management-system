# AWS S3 Setup Guide for Placement Management System

This guide will help you set up AWS S3 for file storage in your placement management system.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [Create S3 Bucket](#create-s3-bucket)
4. [Configure IAM User](#configure-iam-user)
5. [Environment Configuration](#environment-configuration)
6. [Install Dependencies](#install-dependencies)
7. [Integration with Your Application](#integration-with-your-application)
8. [Testing](#testing)
9. [Optional: CloudFront Setup](#optional-cloudfront-setup)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- AWS Account (create one at https://aws.amazon.com/)
- Basic understanding of AWS services
- Node.js and npm installed

---

## AWS Account Setup

1. **Sign in to AWS Console**
   - Go to https://console.aws.amazon.com/
   - Sign in with your AWS account credentials

2. **Choose Your Region**
   - Select a region close to your users (e.g., `us-east-1`, `ap-south-1`)
   - Note: Keep the same region throughout this setup

---

## Create S3 Bucket

1. **Navigate to S3**
   - In AWS Console, search for "S3" and click on it
   - Click "Create bucket"

2. **Configure Bucket Settings**
   - **Bucket name**: Choose a unique name (e.g., `placement-system-files-2024`)
     - Must be globally unique
     - Use lowercase letters, numbers, and hyphens only
   - **Region**: Select your preferred region (e.g., `us-east-1`)
   - **Object Ownership**: Select "ACLs disabled (recommended)"

3. **Block Public Access Settings**
   - For **private files** (recommended for resumes, documents):
     - Keep "Block all public access" **CHECKED**
     - Use presigned URLs for temporary access
   
   - For **public files** (profile pictures, company logos):
     - **UNCHECK** "Block all public access"
     - Acknowledge the warning
     - You can also create separate buckets for public and private files

4. **Bucket Versioning** (Optional but recommended)
   - Enable versioning to keep multiple versions of files

5. **Encryption** (Recommended)
   - Enable "Server-side encryption"
   - Choose "Amazon S3 managed keys (SSE-S3)"

6. **Click "Create bucket"**

7. **Configure Bucket Policy** (For public access if needed)
   - Go to your bucket → Permissions → Bucket Policy
   - Add this policy for public read access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

Replace `YOUR-BUCKET-NAME` with your actual bucket name.

8. **Configure CORS** (Required for web uploads)
   - Go to your bucket → Permissions → CORS
   - Add this configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["http://localhost:3000", "YOUR-PRODUCTION-URL"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

---

## Configure IAM User

1. **Navigate to IAM**
   - In AWS Console, search for "IAM" and click on it
   - Click "Users" → "Create user"

2. **Create User**
   - **User name**: `placement-system-s3-user`
   - Click "Next"

3. **Set Permissions**
   - Select "Attach policies directly"
   - Search for and select: `AmazonS3FullAccess`
   - (For production, create a custom policy with minimal permissions - see below)
   - Click "Next" → "Create user"

4. **Create Access Keys**
   - Click on the newly created user
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Choose "Application running outside AWS"
   - Click "Next" → "Create access key"
   - **IMPORTANT**: Save both:
     - Access Key ID
     - Secret Access Key
     - You won't be able to see the secret key again!

### Production IAM Policy (Recommended)

For production, use a custom policy with minimal permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetObjectAcl",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::YOUR-BUCKET-NAME",
                "arn:aws:s3:::YOUR-BUCKET-NAME/*"
            ]
        }
    ]
}
```

---

## Environment Configuration

1. **Update your `.env` file** with AWS credentials:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name-here

# Optional: CloudFront Distribution URL (for faster content delivery)
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

2. **Security Best Practices**:
   - Never commit `.env` file to version control
   - Use different credentials for development and production
   - Rotate access keys regularly
   - Use AWS Secrets Manager or Parameter Store for production

---

## Install Dependencies

Run the following command to install required AWS SDK packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner uuid
npm install --save-dev @types/uuid
```

### Package Descriptions:
- `@aws-sdk/client-s3`: AWS SDK for S3 operations
- `@aws-sdk/s3-request-presigner`: Generate presigned URLs for temporary access
- `uuid`: Generate unique file names

---

## Integration with Your Application

### 1. Update your main server file

Add the S3 routes to your Express server (e.g., `src/server.ts`):

```typescript
import s3Routes from './routes/s3Routes';

// Add this with your other routes
app.use('/api/s3', s3Routes);
```

### 2. Validate S3 Configuration on Startup

In your `src/server.ts`, add validation:

```typescript
import { validateS3Config } from './config/s3Config';

// Add this before starting the server
if (process.env.USE_S3 === 'true') {
    validateS3Config();
}
```

### 3. Example Usage in Your Controllers

Replace Cloudinary uploads with S3:

```typescript
import { uploadToS3, deleteFromS3 } from '../utils/s3Upload';

// Upload example
const result = await uploadToS3(
    req.file.buffer,
    'resumes',
    req.file.originalname,
    req.file.mimetype
);

// Delete example
await deleteFromS3(fileKey);
```

---

## Testing

### 1. Test S3 Connection

Create a test file `test-s3-connection.ts`:

```typescript
import { s3Client, validateS3Config } from './src/config/s3Config';
import { ListBucketsCommand } from '@aws-sdk/client-s3';

async function testS3Connection() {
    try {
        console.log('Testing S3 configuration...');
        
        if (!validateS3Config()) {
            console.error('S3 configuration is invalid');
            return;
        }

        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        
        console.log('✅ S3 connection successful!');
        console.log('Available buckets:', response.Buckets?.map(b => b.Name));
    } catch (error) {
        console.error('❌ S3 connection failed:', error);
    }
}

testS3Connection();
```

Run it:
```bash
npx ts-node test-s3-connection.ts
```

### 2. Test File Upload via API

Using curl or Postman:

```bash
curl -X POST http://localhost:5000/api/s3/upload \
  -F "file=@/path/to/your/file.pdf" \
  -F "folder=test"
```

### 3. Test Resume Upload

```bash
curl -X POST http://localhost:5000/api/s3/upload-resume \
  -F "resume=@/path/to/resume.pdf" \
  -F "userId=12345"
```

---

## Optional: CloudFront Setup

CloudFront is AWS's CDN service that provides faster content delivery globally.

### 1. Create CloudFront Distribution

1. Go to CloudFront in AWS Console
2. Click "Create Distribution"
3. **Origin Settings**:
   - Origin Domain: Select your S3 bucket
   - Origin Access: "Origin access control settings (recommended)"
   - Create new OAC
4. **Default Cache Behavior**:
   - Viewer Protocol Policy: "Redirect HTTP to HTTPS"
   - Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
5. **Settings**:
   - Price Class: Choose based on your needs
   - Alternate Domain Names (CNAMEs): Optional
6. Click "Create Distribution"

### 2. Update S3 Bucket Policy

CloudFront will provide a bucket policy - add it to your S3 bucket permissions.

### 3. Update Environment Variable

```env
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

---

## Troubleshooting

### Common Issues

1. **Access Denied Error**
   - Check IAM user permissions
   - Verify bucket policy
   - Ensure access keys are correct

2. **CORS Errors**
   - Verify CORS configuration in S3 bucket
   - Check allowed origins match your frontend URL

3. **File Not Found**
   - Verify bucket name in environment variables
   - Check file key/path is correct
   - Ensure file was uploaded successfully

4. **Slow Upload/Download**
   - Consider using CloudFront
   - Check your AWS region selection
   - Verify network connection

5. **Invalid Credentials**
   - Regenerate access keys
   - Check for extra spaces in `.env` file
   - Verify environment variables are loaded

### Debug Mode

Enable debug logging:

```typescript
// In s3Config.ts
console.log('S3 Config:', {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
});
```

---

## Migration from Cloudinary to S3

If you're migrating from Cloudinary:

1. **Keep both systems running initially**
2. **Update upload logic** to use S3
3. **Migrate existing files**:
   - Download from Cloudinary
   - Upload to S3
   - Update database URLs
4. **Test thoroughly** before removing Cloudinary

---

## Security Best Practices

1. ✅ Never commit AWS credentials to version control
2. ✅ Use IAM roles with minimal permissions
3. ✅ Enable S3 bucket versioning
4. ✅ Enable S3 server-side encryption
5. ✅ Use presigned URLs for private files
6. ✅ Implement file size limits
7. ✅ Validate file types before upload
8. ✅ Regularly rotate access keys
9. ✅ Monitor S3 access logs
10. ✅ Use separate buckets for different environments

---

## Cost Optimization

1. **Use S3 Lifecycle Policies**
   - Move old files to cheaper storage classes
   - Delete temporary files automatically

2. **Enable S3 Intelligent-Tiering**
   - Automatically moves objects between access tiers

3. **Monitor Usage**
   - Use AWS Cost Explorer
   - Set up billing alerts

4. **Use CloudFront**
   - Reduces S3 data transfer costs
   - Caches frequently accessed files

---

## API Endpoints

Once integrated, you'll have these endpoints:

- `POST /api/s3/upload` - Upload single file
- `POST /api/s3/upload-multiple` - Upload multiple files
- `DELETE /api/s3/delete` - Delete file
- `POST /api/s3/presigned-url` - Generate presigned URL
- `POST /api/s3/upload-resume` - Upload resume
- `POST /api/s3/upload-profile-picture` - Upload profile picture
- `POST /api/s3/upload-company-logo` - Upload company logo

---

## Support

For issues or questions:
- AWS Documentation: https://docs.aws.amazon.com/s3/
- AWS Support: https://console.aws.amazon.com/support/
- Stack Overflow: Tag questions with `amazon-s3` and `aws-sdk-js-v3`

---

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/best-practices.html)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)
