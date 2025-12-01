import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, FileText, Download, Trash2, CheckCircle, Eye } from 'lucide-react';

// Helper function to get inline viewable URL for Cloudinary files
const getInlineViewUrl = (url) => {
  if (!url) return url;
  
  // If it's a Cloudinary URL with raw resource type, use Google Docs Viewer
  if (url.includes('cloudinary.com') && url.includes('/raw/upload/')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }
  
  // For Cloudinary image type PDFs, add fl_attachment:false
  if (url.includes('cloudinary.com') && url.includes('/image/upload/') && url.includes('.pdf')) {
    return url.replace('/image/upload/', '/image/upload/fl_attachment:false/');
  }
  
  // For Google Drive links, ensure they use preview format
  if (url.includes('drive.google.com') && url.includes('/file/d/')) {
    const fileId = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  
  return url;
};

export default function ResumeUpload({ resumeData, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState(resumeData || null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only PDF or Word documents');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should not exceed 5MB');
      return;
    }

    setUploading(true);

    try {
      // In a real application, upload to server/cloud storage
      // For now, we'll just store the file info
      const resumeInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        // In production, this would be the URL from your storage service
        url: URL.createObjectURL(file)
      };

      setResume(resumeInfo);
      
      if (onUpdate) {
        await onUpdate(resumeInfo);
      }

      alert('Resume uploaded successfully!');
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Error uploading resume');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your resume?')) {
      setResume(null);
      if (onUpdate) {
        await onUpdate(null);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume</CardTitle>
        <CardDescription>Upload and manage your resume (PDF or Word document, max 5MB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <FileText className="inline-block mr-2 h-4 w-4" />
            Keep your resume updated to improve your job application success rate.
          </p>
        </div>

        {!resume ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="font-semibold mb-2">Upload Your Resume</h3>
            <p className="text-sm text-gray-600 mb-4">
              Supported formats: PDF, DOC, DOCX (Max 5MB)
            </p>
            <Label htmlFor="resume-upload" className="cursor-pointer">
              <div className="inline-block">
                <Button type="button" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>
              <Input
                id="resume-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </Label>
          </div>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Current Resume</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>File Name:</strong> {resume.name}</p>
                      <p><strong>Size:</strong> {formatFileSize(resume.size)}</p>
                      <p><strong>Uploaded:</strong> {new Date(resume.uploadDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(getInlineViewUrl(resume.url), '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Resume
                      </Button>
                      <Label htmlFor="resume-update" className="cursor-pointer">
                        <Button type="button" size="sm" variant="outline">
                          <Upload className="w-4 h-4 mr-2" />
                          Replace
                        </Button>
                        <Input
                          id="resume-update"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </Label>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDelete}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-sm">Resume Tips:</h4>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Keep your resume concise and well-formatted</li>
            <li>Highlight relevant skills and experiences</li>
            <li>Use clear section headings</li>
            <li>Include contact information</li>
            <li>Update regularly with new skills and experiences</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
