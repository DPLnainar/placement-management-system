const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

/**
 * Cloudinary File Upload Configuration
 * 
 * Handles file uploads for:
 * - Student resumes (PDF, DOC, DOCX)
 * - Profile photos
 * - Company logos
 * - Offer letters
 * - Other documents
 */

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Storage configuration for student resumes
 */
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'placement-portal/resumes',
    allowed_formats: ['pdf', 'doc', 'docx'],
    resource_type: 'raw', // For non-image files
    public_id: (req, file) => {
      const userId = req.user?.id || 'unknown';
      const timestamp = Date.now();
      return `resume_${userId}_${timestamp}`;
    }
  }
});

/**
 * Storage configuration for profile photos
 */
const photoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'placement-portal/photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => {
      const userId = req.user?.id || 'unknown';
      return `photo_${userId}_${Date.now()}`;
    }
  }
});

/**
 * Storage configuration for company logos
 */
const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'placement-portal/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'svg', 'webp'],
    transformation: [
      { width: 200, height: 200, crop: 'fit' },
      { quality: 'auto' }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      return `logo_${timestamp}`;
    }
  }
});

/**
 * Storage configuration for general documents
 */
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'placement-portal/documents',
    allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
    resource_type: 'auto',
    public_id: (req, file) => {
      const timestamp = Date.now();
      return `doc_${timestamp}`;
    }
  }
});

/**
 * File filter for resumes
 */
const resumeFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

/**
 * File filter for images
 */
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.'), false);
  }
};

/**
 * Multer upload middleware for resumes
 */
const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

/**
 * Multer upload middleware for profile photos
 */
const uploadPhoto = multer({
  storage: photoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  }
});

/**
 * Multer upload middleware for company logos
 */
const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB max file size
  }
});

/**
 * Multer upload middleware for general documents
 */
const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

/**
 * Delete file from Cloudinary
 */
const deleteFile = async (publicId, resourceType = 'raw') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get file URL from public ID
 */
const getFileUrl = (publicId, resourceType = 'raw') => {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true
  });
};

module.exports = {
  cloudinary,
  uploadResume,
  uploadPhoto,
  uploadLogo,
  uploadDocument,
  deleteFile,
  getFileUrl
};
