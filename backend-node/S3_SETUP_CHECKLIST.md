# AWS S3 Setup - Quick Checklist

Use this checklist while following the detailed setup guide.

## 🚀 Quick Setup Steps

### Phase 1: AWS Account (5 minutes)
```
[ ] 1. Go to https://aws.amazon.com/
[ ] 2. Click "Create an AWS Account"
[ ] 3. Complete registration (email, payment, phone verification)
[ ] 4. Choose "Basic Support - Free" plan
[ ] 5. Sign in to AWS Console
```

### Phase 2: Create S3 Bucket (3 minutes)
```
[ ] 1. Search for "S3" in AWS Console
[ ] 2. Click "Create bucket"
[ ] 3. Enter bucket name: placement-system-files-2024
[ ] 4. Choose region: ap-south-1 (Mumbai) or us-east-1 (cheapest)
[ ] 5. Object Ownership: "ACLs disabled"
[ ] 6. Block Public Access: ✅ (for private files) or ❌ (for public files)
[ ] 7. Enable Versioning: ✅
[ ] 8. Enable Encryption: SSE-S3
[ ] 9. Click "Create bucket"
```

### Phase 3: Configure CORS (2 minutes)
```
[ ] 1. Click on your bucket name
[ ] 2. Go to "Permissions" tab
[ ] 3. Scroll to "CORS" section
[ ] 4. Click "Edit"
[ ] 5. Paste CORS configuration (from guide)
[ ] 6. Update AllowedOrigins with your URLs
[ ] 7. Click "Save changes"
```

### Phase 4: Create IAM User (5 minutes)
```
[ ] 1. Search for "IAM" in AWS Console
[ ] 2. Click "Users" → "Create user"
[ ] 3. Username: placement-system-s3-user
[ ] 4. Click "Next"
[ ] 5. Select "Attach policies directly"
[ ] 6. Search and select "AmazonS3FullAccess"
[ ] 7. Click "Next" → "Create user"
```

### Phase 5: Generate Access Keys (2 minutes)
```
[ ] 1. Click on the new user
[ ] 2. Go to "Security credentials" tab
[ ] 3. Click "Create access key"
[ ] 4. Select "Application running outside AWS"
[ ] 5. Click "Next" → "Create access key"
[ ] 6. Download .csv file with credentials
[ ] 7. Save credentials securely
```

### Phase 6: Configure Application (3 minutes)
```
[ ] 1. Open .env file in backend folder
[ ] 2. Add AWS_ACCESS_KEY_ID=<your-key>
[ ] 3. Add AWS_SECRET_ACCESS_KEY=<your-secret>
[ ] 4. Add AWS_REGION=<your-region>
[ ] 5. Add AWS_S3_BUCKET_NAME=<your-bucket-name>
[ ] 6. Add USE_S3=true
[ ] 7. Save .env file
```

### Phase 7: Test Connection (1 minute)
```
[ ] 1. Run: npx ts-node test-s3-connection.ts
[ ] 2. Verify: ✅ S3 configuration validated
[ ] 3. Verify: ✅ S3 connection successful
[ ] 4. Verify: ✅ Target bucket exists
```

---

## 📋 Information You'll Need

Keep these handy during setup:

| Item | Your Value | Where to Find |
|------|------------|---------------|
| **Bucket Name** | _________________ | You choose (must be unique) |
| **AWS Region** | _________________ | Choose from dropdown |
| **Access Key ID** | _________________ | IAM → Create access key |
| **Secret Access Key** | _________________ | IAM → Create access key |
| **Frontend URL** | http://localhost:3000 | Your React app URL |
| **Backend URL** | http://localhost:5000 | Your Express server URL |

---

## 🎯 CORS Configuration Template

Copy this when configuring CORS:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:5000"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

---

## 🔐 .env Configuration Template

Copy this to your .env file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-here
AWS_SECRET_ACCESS_KEY=your-secret-key-here
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=placement-system-files-2024
AWS_CLOUDFRONT_URL=
USE_S3=true
```

---

## ⚡ Quick Commands

After setup, use these commands:

```bash
# Test S3 connection
npx ts-node test-s3-connection.ts

# Start backend with S3
npm run dev

# Test file upload
curl -X POST http://localhost:5000/api/s3/upload \
  -F "file=@/path/to/test.pdf" \
  -F "folder=test"
```

---

## ✅ Success Indicators

You'll know setup is complete when:

1. ✅ Bucket appears in S3 console
2. ✅ IAM user shows in IAM console
3. ✅ Access keys downloaded
4. ✅ .env file updated
5. ✅ Test script shows all green checkmarks
6. ✅ No errors when starting backend

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Bucket name taken | Add college name or random numbers |
| Access denied | Check IAM permissions |
| CORS error | Verify AllowedOrigins in CORS config |
| Connection failed | Check credentials in .env |
| Test script fails | Verify all environment variables |

---

## 📞 Support

- Detailed Guide: See s3_bucket_setup_guide.md
- API Reference: See S3_QUICK_REFERENCE.md
- AWS Docs: https://docs.aws.amazon.com/s3/

---

**Total Setup Time: ~20 minutes**

Good luck! 🚀
