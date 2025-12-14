
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moderatorAPI, userAPI } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, User, Mail, GraduationCap, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function ModeratorJobDetails() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewingStudent, setViewingStudent] = useState(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchJobDetails();
    }, [jobId]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);
            const response = await moderatorAPI.getJobStudents(jobId);
            // Response structure: { success: true, job: {...}, students: [...] }
            setJob(response.data.job);
            setStudents(response.data.students || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching job details:', error);
            setError('Failed to load job details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        navigate('/dashboard');
    };

    const handleViewStudent = async (studentData) => {
        // If we have full details in the list, use them. 
        // Otherwise, or if we need fresh data, we could fetch.
        // The controller returns a subset. For full profile view, we might want to fetch.
        // However, for basic "read-only view", let's see what we need.
        // The previous implementation used userAPI.getById(id). Let's do that to be safe.

        try {
            const response = await userAPI.getById(studentData.studentId || studentData.userId);
            setViewingStudent(response.data.data || response.data);
            setShowStudentModal(true);
        } catch (err) {
            console.error("Failed to fetch student details", err);
            // Fallback to basic data if fetch fails
            setViewingStudent(studentData);
            setShowStudentModal(true);
        }
    };

    const handleBlockStudent = async (studentUserId, studentName) => {
        const reason = prompt(`Enter reason for blocking ${studentName}:`);
        if (!reason || reason.trim() === '') {
            alert('Reason is required to block a student');
            return;
        }

        if (!confirm(`Are you sure you want to block ${studentName}?`)) return;

        try {
            setActionLoading(true);
            await moderatorAPI.blockStudent(studentUserId, reason);
            alert('Student blocked successfully');
            fetchJobDetails();
        } catch (error) {
            console.error('Error blocking student:', error);
            alert('Failed to block student: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnblockStudent = async (studentUserId, studentName) => {
        if (!confirm(`Are you sure you want to unblock ${studentName}?`)) return;

        try {
            setActionLoading(true);
            await moderatorAPI.unblockStudent(studentUserId);
            alert('Student unblocked successfully');
            fetchJobDetails();
        } catch (error) {
            console.error('Error unblocking student:', error);
            alert('Failed to unblock student: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteStudent = async (studentUserId, studentName) => {
        const reason = prompt(`Enter reason for deleting ${studentName}'s profile:`);
        if (!reason || reason.trim() === '') {
            alert('Reason is required to delete a student');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${studentName}? This will mark their profile as deleted and set their account to inactive.`)) return;

        try {
            setActionLoading(true);
            await moderatorAPI.deleteStudent(studentUserId, reason);
            alert('Student profile deleted successfully');
            fetchJobDetails();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Failed to delete student: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPLIED':
            case 'pending':
                return <Badge className="bg-yellow-500">Applied</Badge>;
            case 'SHORTLISTED':
            case 'shortlisted':
                return <Badge className="bg-blue-500">Shortlisted</Badge>;
            case 'SELECTED':
            case 'selected':
            case 'offered':
            case 'offer_accepted':
            case 'placed':
                return <Badge className="bg-green-500">Selected</Badge>;
            case 'REJECTED':
            case 'rejected':
            case 'not_applied':
                return <Badge variant="outline" className="text-gray-500">Not Applied</Badge>;
            default:
                // Check if it's actually applied but with a different status string
                if (status && status !== 'not_applied') {
                    return <Badge className="bg-blue-400">{status}</Badge>;
                }
                return <Badge variant="outline" className="text-gray-500">Not Applied</Badge>;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading details...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="text-red-500 mb-4">{error}</div>
                <Button onClick={handleClose}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <Button variant="ghost" className="mb-4 pl-0" onClick={handleClose}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>{job?.title || 'Job Details'}</CardTitle>
                        <CardDescription>{job?.companyName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold mb-2">Eligible Students in your Department</h3>
                                <p className="text-sm text-gray-500">
                                    Listing {students.length} students who match the eligibility criteria.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Student Name</th>
                                        <th className="px-6 py-3">Reg. No</th>
                                        <th className="px-6 py-3">CGPA</th>
                                        <th className="px-6 py-3">Backlogs</th>
                                        <th className="px-6 py-3">Eligibility</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Action</th>
                                        <th className="px-6 py-3">Manage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.studentId} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{student.fullName}</td>
                                            <td className="px-6 py-4">{student.registrationNumber}</td>
                                            <td className="px-6 py-4">{student.cgpa}</td>
                                            <td className="px-6 py-4">
                                                {student.backlogs > 0 ? (
                                                    <span className="text-red-500 font-semibold">{student.backlogs} (Current)</span>
                                                ) : student.historyBacklogs > 0 ? (
                                                    <span className="text-orange-500">{student.historyBacklogs} (History)</span>
                                                ) : (
                                                    <span className="text-green-500">0</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.isEligible ? (
                                                    <span className="flex items-center text-green-600">
                                                        <CheckCircle className="w-4 h-4 mr-1" /> Eligible
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-red-600" title={student.eligibilityReasons?.join(', ')}>
                                                        <AlertCircle className="w-4 h-4 mr-1" /> Not Eligible
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(student.applicationStatus)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewStudent(student)}
                                                    disabled={actionLoading}
                                                >
                                                    View Profile
                                                </Button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {student.isBlocked ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUnblockStudent(student.userId, student.fullName)}
                                                            disabled={actionLoading}
                                                            className="bg-green-50 hover:bg-green-100 text-green-700"
                                                        >
                                                            Unblock
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleBlockStudent(student.userId, student.fullName)}
                                                            disabled={actionLoading}
                                                        >
                                                            Block
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteStudent(student.userId, student.fullName)}
                                                        disabled={actionLoading || student.isDeleted}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                No eligible students found in your department.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Student Profile Modal (Simplified View) */}
            {showStudentModal && viewingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <CardHeader className="sticky top-0 bg-white z-10 border-b">
                            <div className="flex justify-between items-center">
                                <CardTitle>Student Profile</CardTitle>
                                <Button variant="ghost" onClick={() => setShowStudentModal(false)}>Close</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <User className="w-4 h-4 mr-2" /> Personal Details
                                    </h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p><span className="font-medium">Name:</span> {viewingStudent.fullName || viewingStudent.name}</p>
                                        <p><span className="font-medium">Email:</span> {viewingStudent.email}</p>
                                        <p><span className="font-medium">Phone:</span> {viewingStudent.phone || 'N/A'}</p>
                                        <p><span className="font-medium">Department:</span> {viewingStudent.department}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <GraduationCap className="w-4 h-4 mr-2" /> Academic Details
                                    </h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p><span className="font-medium">CGPA:</span> {viewingStudent.cgpa || viewingStudent.academic?.cgpa || 'N/A'}</p>
                                        <p><span className="font-medium">Current Backlogs:</span> {viewingStudent.currentBacklogs || viewingStudent.academic?.backlogs || 0}</p>
                                        <p><span className="font-medium">10th %:</span> {viewingStudent.tenthPercentage || 'N/A'}</p>
                                        <p><span className="font-medium">12th %:</span> {viewingStudent.twelfthPercentage || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Add more sections as needed (Skills, Projects, etc.) depending on what's available in viewingStudent object */}
                            <div className="bg-gray-50 p-4 rounded-md text-xs text-gray-500">
                                <p>Refer to the full student database for complete records.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
