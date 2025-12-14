import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3, S3_BUCKET } from '../utils/s3';

// Photo Upload Configuration
export const uploadPhoto = multer({
    storage: multerS3({
        s3,
        bucket: S3_BUCKET,
        // acl: 'public-read', // Disabled for Bucket Owner Enforced
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req: any, file: any, cb: any) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req: any, file: any, cb: any) => {
            const fileName = `photos/${req.user._id}_${Date.now()}_${file.originalname}`;
            cb(null, fileName);
        },
    }),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
    },
    fileFilter: (req: any, file: any, cb: any) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
});

// Resume Upload Configuration
export const uploadResume = multer({
    storage: multerS3({
        s3,
        bucket: S3_BUCKET,
        // acl: 'public-read', // Disabled for Bucket Owner Enforced
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req: any, file: any, cb: any) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req: any, file: any, cb: any) => {
            const fileName = `resumes/${req.user._id}_${Date.now()}_${file.originalname}`;
            cb(null, fileName);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req: any, file: any, cb: any) => {
        // Accept PDF only
        if (!file.originalname.match(/\.(pdf)$/i)) {
            return cb(new Error('Only PDF files are allowed!'), false);
        }
        cb(null, true);
    },
});
