import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { X, CheckCircle, XCircle, FileText, Download } from 'lucide-react';
import { verificationAPI } from '../../services/api';

const SplitViewModal = ({ student, onClose, onSuccess }) => {
    const [rejectionReason, setRejectionReason] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve this student\'s verification?')) {
            return;
        }

        try {
            setIsApproving(true);
            const response = await verificationAPI.approve(student._id, 'Approved by moderator');

            if (response.data.success) {
                alert('Student verification approved successfully!');
                onSuccess();
            } else {
                throw new Error(response.data.message || 'Failed to approve verification');
            }
        } catch (error) {
            console.error('Error approving verification:', error);
            alert(`Failed to approve: ${error.message}`);
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        if (!window.confirm('Are you sure you want to reject this student\'s verification?')) {
            return;
        }

        try {
            setIsRejecting(true);
            const response = await verificationAPI.reject(student._id, rejectionReason.trim());

            if (response.data.success) {
                alert('Student verification rejected');
                onSuccess();
            } else {
                throw new Error(response.data.message || 'Failed to reject verification');
            }
        } catch (error) {
            console.error('Error rejecting verification:', error);
            alert(`Failed to reject: ${error.message}`);
        } finally {
            setIsRejecting(false);
        }
    };

    const renderDocumentViewer = (url, label) => {
        if (!url) {
            return (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded">
                    <p className="text-gray-500">No {label} uploaded</p>
                </div>
            );
        }

        // Check if it's a PDF
        if (url.toLowerCase().endsWith('.pdf')) {
            return (
                <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{label}</span>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                            <Download size={16} />
                            Download
                        </a>
                    </div>
                    <iframe
                        src={url}
                        className="w-full flex-1 border rounded"
                        title={label}
                    />
                </div>
            );
        }

        // For images
        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{label}</span>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                        <Download size={16} />
                        View Full Size
                    </a>
                </div>
                <img
                    src={url}
                    alt={label}
                    className="w-full h-auto object-contain rounded border"
                />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-2xl font-bold">Student Verification</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Split View Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left Panel - Student Data */}
                    <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r">
                        <Card>
                            <CardHeader>
                                <CardTitle>Student Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                                    <p className="text-lg font-semibold">{student.personal?.name || 'N/A'}</p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                                    <p>{student.personal?.email || 'N/A'}</p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Phone</Label>
                                    <p>{student.personal?.phone || 'N/A'}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">CGPA</Label>
                                        <p className="text-lg font-semibold">{student.cgpa || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Semester</Label>
                                        <p className="text-lg font-semibold">{student.semester || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Department</Label>
                                    <p>{student.personal?.branch || 'N/A'}</p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Registration Number</Label>
                                    <p>{student.rollNumber || student.personal?.rollNumber || 'N/A'}</p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Current Backlogs</Label>
                                    <p>{student.currentBacklogs || 0}</p>
                                </div>

                                {student.verificationTriggers && student.verificationTriggers.length > 0 && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Recent Changes</Label>
                                        <div className="mt-2 space-y-1">
                                            {student.verificationTriggers.slice(0, 3).map((trigger, idx) => (
                                                <p key={idx} className="text-sm text-gray-600">
                                                    • {trigger.field}: {trigger.oldValue} → {trigger.newValue}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="mt-6 space-y-3">
                            {!showRejectForm ? (
                                <>
                                    <Button
                                        onClick={handleApprove}
                                        disabled={isApproving || isRejecting}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        size="lg"
                                    >
                                        <CheckCircle className="mr-2" size={20} />
                                        {isApproving ? 'Approving...' : 'Approve Verification'}
                                    </Button>
                                    <Button
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={isApproving || isRejecting}
                                        variant="destructive"
                                        className="w-full"
                                        size="lg"
                                    >
                                        <XCircle className="mr-2" size={20} />
                                        Reject Verification
                                    </Button>
                                </>
                            ) : (
                                <Card className="border-red-200 bg-red-50">
                                    <CardContent className="pt-4">
                                        <Label htmlFor="rejectionReason" className="text-sm font-medium">
                                            Rejection Reason *
                                        </Label>
                                        <Textarea
                                            id="rejectionReason"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Please provide a detailed reason for rejection..."
                                            className="mt-2 min-h-[100px]"
                                        />
                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                onClick={handleReject}
                                                disabled={isRejecting || !rejectionReason.trim()}
                                                variant="destructive"
                                                className="flex-1"
                                            >
                                                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setShowRejectForm(false);
                                                    setRejectionReason('');
                                                }}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Documents */}
                    <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-gray-50">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <FileText size={20} />
                                Documents
                            </h3>

                            {/* Resume */}
                            <div className="h-96">
                                {renderDocumentViewer(
                                    student.resume?.resumeUrl || student.resumeUrl,
                                    'Resume'
                                )}
                            </div>

                            {/* Photo */}
                            {student.personal?.photoUrl && (
                                <div className="h-64">
                                    {renderDocumentViewer(student.personal.photoUrl, 'Photo')}
                                </div>
                            )}

                            {/* Marksheets */}
                            {student.education?.marksheets && student.education.marksheets.length > 0 && (
                                <div className="space-y-4">
                                    {student.education.marksheets.map((marksheet, idx) => (
                                        <div key={idx} className="h-96">
                                            {renderDocumentViewer(marksheet.url, `Marksheet - Semester ${marksheet.semester}`)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!student.resume?.resumeUrl && !student.resumeUrl && !student.personal?.photoUrl && (
                                <div className="text-center py-12 text-gray-500">
                                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No documents uploaded yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplitViewModal;
