import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import SplitViewModal from './SplitViewModal';

const VerificationQueue = () => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [queueCount, setQueueCount] = useState(0);

    useEffect(() => {
        fetchQueue();
        fetchQueueCount();
    }, []);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/moderator/verification/queue', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch verification queue');
            }

            const data = await response.json();
            setQueue(data.data || []);
            setQueueCount(data.count || 0);
        } catch (error) {
            console.error('Error fetching verification queue:', error);
            alert('Failed to load verification queue');
        } finally {
            setLoading(false);
        }
    };

    const fetchQueueCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/moderator/verification/queue/count', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setQueueCount(data.count || 0);
            }
        } catch (error) {
            console.error('Error fetching queue count:', error);
        }
    };

    const handleReviewClick = async (student) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/moderator/verification/${student.studentId}/details`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch student details');
            }

            const data = await response.json();
            setSelectedStudent(data.data);
            setShowModal(true);
        } catch (error) {
            console.error('Error fetching student details:', error);
            alert('Failed to load student details');
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedStudent(null);
    };

    const handleVerificationSuccess = () => {
        setShowModal(false);
        setSelectedStudent(null);
        fetchQueue(); // Refresh the queue
        fetchQueueCount();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading verification queue...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">Verification Queue</CardTitle>
                            <CardDescription>
                                Review and approve student profile verifications
                            </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-lg px-4 py-2">
                            {queueCount} Pending
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {queue.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg">No pending verifications</p>
                            <p className="text-sm mt-2">All students in your department are verified!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Registration No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            CGPA
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Semester
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Request Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {queue.map((student) => (
                                        <tr key={student.studentId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.fullName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {student.registrationNumber || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {student.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {student.cgpa || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {student.semester || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(student.lastVerificationRequest)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Button
                                                    onClick={() => handleReviewClick(student)}
                                                    size="sm"
                                                    variant="default"
                                                >
                                                    Review
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showModal && selectedStudent && (
                <SplitViewModal
                    student={selectedStudent}
                    onClose={handleModalClose}
                    onSuccess={handleVerificationSuccess}
                />
            )}
        </div>
    );
};

export default VerificationQueue;
