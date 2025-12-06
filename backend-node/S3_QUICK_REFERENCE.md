# AWS S3 Integration - Quick Reference

## 📦 Files Created

### Configuration
- `src/config/s3Config.ts` - S3 client configuration and validation
- `env.s3.example` - Environment variable template

### Utilities
- `src/utils/s3Upload.ts` - S3 upload/delete/presigned URL functions

### Middleware
- `src/middleware/s3Multer.ts` - Multer configuration for S3 uploads

### Controllers & Routes
- `src/controllers/s3UploadController.ts` - Upload endpoints
- `src/routes/s3Routes.ts` - API routes for S3 operations

### Documentation & Testing
- `AWS_S3_SETUP.md` - Complete setup guide
- `test-s3-connection.ts` - Connection test script

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner uuid
npm install --save-dev @types/uuid
```

### 2. Configure Environment Variables
Add to your `.env` file:
```env
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
USE_S3=true
```

### 3. Add Routes to Server
In `src/server.ts`:
```typescript
import s3Routes from './routes/s3Routes';

app.use('/api/s3', s3Routes);
```

### 4. Test Connection
```bash
npx ts-node test-s3-connection.ts
```

---

## 📡 API Endpoints

### Upload Single File
```bash
POST /api/s3/upload
Content-Type: multipart/form-data

Body:
- file: [file]
- folder: "uploads" (optional)
```

### Upload Multiple Files
```bash
POST /api/s3/upload-multiple
Content-Type: multipart/form-data

Body:
- files: [file1, file2, ...]
- folder: "uploads" (optional)
```

### Upload Resume
```bash
POST /api/s3/upload-resume
Content-Type: multipart/form-data

Body:
- resume: [PDF/DOC file]
- userId: "12345"
```

### Upload Profile Picture
```bash
POST /api/s3/upload-profile-picture
Content-Type: multipart/form-data

Body:
- profilePicture: [image file]
- userId: "12345"
```

### Upload Company Logo
```bash
POST /api/s3/upload-company-logo
Content-Type: multipart/form-data

Body:
- logo: [image file]
- companyId: "12345"
```

### Delete File
```bash
DELETE /api/s3/delete
Content-Type: application/json

Body:
{
  "key": "resumes/12345/file.pdf"
  // OR
  "url": "https://bucket.s3.region.amazonaws.com/resumes/12345/file.pdf"
}
```

### Generate Presigned URL
```bash
POST /api/s3/presigned-url
Content-Type: application/json

Body:
{
  "key": "resumes/12345/file.pdf",
  "expiresIn": 3600  // seconds (optional, default: 3600)
}
```

---

## 💻 Usage Examples

### In Your Controllers

```typescript
import { uploadToS3, deleteFromS3, getPresignedUrl } from '../utils/s3Upload';

// Upload a file
const result = await uploadToS3(
    req.file.buffer,
    'resumes',
    req.file.originalname,
    req.file.mimetype
);
console.log(result.url); // File URL
console.log(result.key); // S3 key for deletion

// Delete a file
await deleteFromS3(result.key);

// Get temporary access URL (for private files)
const presignedUrl = await getPresignedUrl(result.key, 3600);
```

### Frontend Upload Example (React)

```javascript
const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'resumes');

    const response = await fetch('http://localhost:5000/api/s3/upload', {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    console.log('File URL:', data.data.url);
};
```

---

## 🔧 Configuration Options

### File Size Limits
Edit in `src/middleware/s3Multer.ts`:
```typescript
limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
}
```

### Allowed File Types
Edit in `src/middleware/s3Multer.ts`:
```typescript
const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    // Add more...
];
```

### S3 Folders
Organize files by folder:
- `resumes/` - Student resumes
- `profile-pictures/` - User profile pictures
- `company-logos/` - Company logos
- `documents/` - General documents

---

## 🔐 Security Best Practices

1. ✅ Never commit `.env` file
2. ✅ Use IAM roles with minimal permissions
3. ✅ Enable S3 bucket encryption
4. ✅ Use presigned URLs for private files
5. ✅ Validate file types and sizes
6. ✅ Implement rate limiting on upload endpoints
7. ✅ Add authentication middleware to routes

### Add Authentication
Uncomment in `src/routes/s3Routes.ts`:
```typescript
import { protect } from '../middleware/auth';

router.post('/upload', protect, s3Upload.single('file'), uploadFile);
```

---

## 🐛 Troubleshooting

### "Access Denied" Error
- Check IAM user permissions
- Verify AWS credentials in `.env`
- Check S3 bucket policy

### "Bucket Not Found" Error
- Verify `AWS_S3_BUCKET_NAME` in `.env`
- Ensure bucket exists in the correct region

### CORS Errors
- Add CORS configuration to S3 bucket
- See `AWS_S3_SETUP.md` for CORS policy

### File Upload Fails
- Check file size limits
- Verify file type is allowed
- Check network connectivity

---

## 📊 Monitoring & Costs

### Monitor Usage
- AWS Console → S3 → Metrics
- Set up CloudWatch alarms
- Enable S3 access logging

### Estimate Costs
- Storage: ~$0.023/GB/month
- Requests: ~$0.005/1000 PUT requests
- Data transfer: First 100GB/month free

### Cost Optimization
- Use S3 Lifecycle policies
- Enable S3 Intelligent-Tiering
- Use CloudFront for frequently accessed files

---

## 🔄 Migration from Cloudinary

If migrating from Cloudinary:

1. Keep both systems running
2. Update new uploads to use S3
3. Gradually migrate old files
4. Update database URLs
5. Test thoroughly
6. Remove Cloudinary when complete

---

## 📚 Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Complete Setup Guide](./AWS_S3_SETUP.md)

---

## 🆘 Support

For detailed setup instructions, see `AWS_S3_SETUP.md`

For issues:
- Check environment variables
- Run `npx ts-node test-s3-connection.ts`
- Review AWS CloudWatch logs
- Check IAM permissions
