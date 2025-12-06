/**
 * Student Data Model - Updated for S3 Integration
 * 
 * This shows how to update your StudentData model to store S3 file information
 */

import mongoose, { Schema, Document } from 'mongoose';

// Interface for file stored in S3
interface S3File {
    url: string; // Full S3 or CloudFront URL
    key: string; // S3 object key (for deletion)
    uploadedAt: Date;
    originalName?: string;
    size?: number; // File size in bytes
}

// Student Data Interface
export interface IStudentData extends Document {
    userId: mongoose.Types.ObjectId;

    // Profile Information
    profilePicture?: S3File;

    // Resume
    resume?: S3File;

    // Additional Documents
    documents?: S3File[];

    // Other student fields...
    personalInfo?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        dateOfBirth?: Date;
    };

    academicInfo?: {
        rollNumber: string;
        department: string;
        year: number;
        cgpa: number;
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

// S3 File Schema
const S3FileSchema = new Schema<S3File>(
    {
        url: {
            type: String,
            required: true,
        },
        key: {
            type: String,
            required: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
        originalName: {
            type: String,
        },
        size: {
            type: Number,
        },
    },
    { _id: false }
);

// Student Data Schema
const StudentDataSchema = new Schema<IStudentData>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },

        profilePicture: S3FileSchema,

        resume: S3FileSchema,

        documents: [S3FileSchema],

        personalInfo: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String },
            dateOfBirth: { type: Date },
        },

        academicInfo: {
            rollNumber: { type: String, required: true },
            department: { type: String, required: true },
            year: { type: Number, required: true },
            cgpa: { type: Number },
        },
    },
    {
        timestamps: true,
    }
);

// Helper function to delete S3 files for a student
async function deleteStudentS3Files(studentData: any) {
    try {
        const { deleteFromS3 } = await import('../utils/s3Upload');

        // Delete profile picture
        if (studentData.profilePicture?.key) {
            await deleteFromS3(studentData.profilePicture.key);
        }

        // Delete resume
        if (studentData.resume?.key) {
            await deleteFromS3(studentData.resume.key);
        }

        // Delete all documents
        if (studentData.documents && studentData.documents.length > 0) {
            for (const doc of studentData.documents) {
                if (doc.key) {
                    await deleteFromS3(doc.key);
                }
            }
        }
    } catch (error) {
        console.error('Error deleting S3 files:', error);
    }
}

// Middleware to delete S3 files when student is deleted using deleteOne()
StudentDataSchema.pre('deleteOne', { document: true, query: false }, async function () {
    await deleteStudentS3Files(this);
});

// Middleware to delete S3 files when student is deleted using findOneAndDelete()
StudentDataSchema.pre('findOneAndDelete', async function () {
    const doc = await this.model.findOne(this.getFilter());
    if (doc) {
        await deleteStudentS3Files(doc);
    }
});

export default mongoose.model<IStudentData>('StudentData', StudentDataSchema);
