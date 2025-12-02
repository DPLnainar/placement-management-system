import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, FileText, Download, Trash2, CheckCircle, Eye } from 'lucide-react';
import { uploadAPI } from '../services/api';

// Helper function to get inline viewable URL for Cloudinary files
const getInlineViewUrl = (url) => {
  if (!url) return url;
  
  // For Cloudinary PDF URLs, add transformation to ensure inline display
  if (url.includes('cloudinary.com') && url.includes('.pdf')) {
    // Convert image resource type to raw and add fl_attachment:false transformation
    let fixedUrl = url.replace('/image/upload/', '/raw/upload/');
    // Add fl_attachment:false transformation to force inline display instead of download
    const urlParts = fixedUrl.split('/upload/');
    if (urlParts.length === 2) {
      return `${urlParts[0]}/upload/fl_attachment:false/${urlParts[1]}`;
    }
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
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

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
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('resume', file); // Must match backend multer field name

      // Upload to backend which will store in Cloudinary
      const response = await uploadAPI.uploadResume(formData);

      if (response.data && response.data.data) {
        const resumeInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date().toISOString(),
          // This is the Cloudinary URL returned from backend
          url: response.data.data.resumeUrl
        };

        setResume(resumeInfo);
        
        if (onUpdate) {
          await onUpdate(resumeInfo);
        }

        alert('Resume uploaded successfully to Cloudinary!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert(`Error uploading resume: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your resume?')) {
      try {
        // Call backend to delete from Cloudinary
        await uploadAPI.deleteResume();
        setResume(null);
        if (onUpdate) {
          await onUpdate(null);
        }
        alert('Resume deleted successfully');
      } catch (error) {
        console.error('Error deleting resume:', error);
        alert(`Error deleting resume: ${error.message}`);
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
                        onClick={() => {
                          setPdfUrl(resume.url);
                          setShowPdfModal(true);
                        }}
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

    {/* PDF Viewer Modal */}
    {showPdfModal && pdfUrl && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-11/12 h-5/6 flex flex-col">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Resume Preview</h2>
            <button
              onClick={() => setShowPdfModal(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`${pdfUrl}?dl=false`}
              className="w-full h-full border-none"
              title="Resume Preview"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex justify-between items-center p-4 border-t bg-gray-50">
            <a
              href={`${pdfUrl}?dl=false`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Open in new tab
            </a>
            <button
              onClick={() => setShowPdfModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  );
