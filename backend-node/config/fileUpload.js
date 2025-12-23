const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

/**
 * AWS S3 File Upload Configuration
 * 
 * Handles file uploads to AWS S3 bucket:
 * - Student resumes (PDF, DOC, DOCX)
 * - Profile photos
 * - Company logos
 * - Other documents
 */

// Initialize S3 Client
const s3Config = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

const s3 = new S3Client(s3Config);

/**
 * Common S3 Storage Factory
 * Creates a multer-s3 storage engine with specified folder and settings
 */
<<<<<<< Updated upstream
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'placement-portal/resumes',
    allowed_formats: ['pdf', 'doc', 'docx'],
    resource_type: 'auto', // Auto-detect resource type
    type: 'upload', // Public upload
    public_id: (req, file) => {
      const userId = req.user?.id || 'unknown';
      const timestamp = Date.now();
      // Don't add extension - Cloudinary adds it automatically based on allowed_formats
      return `resume_${userId}_${timestamp}`;
=======
const createS3Storage = (folderInfo) => {
  return multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const folder = folderInfo.folder || 'misc';

      // Determine filename
      let filename;
      if (req.user && req.user.id) {
        // User-specific filename
        const timestamp = Date.now();
        const ext = file.originalname.split('.').pop();
        filename = `${folderInfo.prefix}_${req.user.id}_${timestamp}.${ext}`;
      } else {
        // Generic filename
        const timestamp = Date.now();
        filename = `${folderInfo.prefix}_${timestamp}_${file.originalname}`;
      }

      // Full S3 Key (path)
      const fullPath = `placement-portal/${folder}/${filename}`;
      cb(null, fullPath);
>>>>>>> Stashed changes
    }
  });
};

/**
 * File Filters
 */
const filters = {
  resume: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  },
  image: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.'), false);
  }
};

/**
 * Multer Instances
 */

// Resume Upload
const uploadResume = multer({
  storage: createS3Storage({ folder: 'resumes', prefix: 'resume' }),
  fileFilter: filters.resume,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Photo Upload
const uploadPhoto = multer({
  storage: createS3Storage({ folder: 'photos', prefix: 'photo' }),
  fileFilter: filters.image,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Logo Upload
const uploadLogo = multer({
  storage: createS3Storage({ folder: 'logos', prefix: 'logo' }),
  fileFilter: filters.image,
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB
});

// Document Upload
const uploadDocument = multer({
  storage: createS3Storage({ folder: 'documents', prefix: 'doc' }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * Delete file from S3
 * Uses DeleteObjectCommand from AWS SDK v3
 */
const deleteFile = async (key) => {
  try {
    if (!key) return;

    // Extract key if a full URL is passed
    // Example: https://my-bucket.s3.region.amazonaws.com/path/to/file.jpg -> path/to/file.jpg
    let objectKey = key;
    if (key.startsWith('http')) {
      const urlParts = key.split('.com/');
      if (urlParts.length > 1) {
        objectKey = urlParts[1];
      }
    }

    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME,
      Key: objectKey,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    // Don't throw error to prevent crashing on cleanup
    return false;
  }
};

/**
 * Get file URL (Helper)
 * S3 URLs are public (if bucket allows) or presigned (future improvement)
 * Currently returns standard S3 object URL
 */
const getFileUrl = (key) => {
  if (!key) return '';
  if (key.startsWith('http')) return key;
  const bucketName = process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = {
  s3,
  uploadResume,
  uploadPhoto,
  uploadLogo,
  uploadDocument,
  deleteFile,
  getFileUrl
};
