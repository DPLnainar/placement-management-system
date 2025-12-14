
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { moderatorAPI } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Briefcase, Users, UserCheck, UserX, Trash2, Eye, Edit } from 'lucide-react';

export default function ModeratorJobsList({ onEdit }) {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await moderatorAPI.getJobs();
            // Handle response structure: response.data.data per controller
            const jobsData = response.data.data || [];
            setJobs(jobsData);
            setError(null);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setError('Failed to load jobs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewJob = (jobId) => {
        navigate(`/moderator/job/${jobId}`);
    };

    if (loading) {
        return <div className="text-center py-8">Loading jobs...</div>;
    }

    if (error) {
        return <div className="text-center text-red-600 py-8">{error}</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Job Postings</CardTitle>
                <CardDescription>All active job postings for your college</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <Card key={job._id || job.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle>{job.company || job.companyName}</CardTitle>
                                        <CardDescription>
                                            {job.location} • {job.title || job.jobCategory}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {onEdit && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEdit(job)}
                                            >
                                                <Edit className="h-4 w-4 mr-1" /> Edit
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewJob(job._id || job.id)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" /> View Details
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-2">{job.description}</p>
                                {job.salary && <p className="text-sm text-gray-600">Salary: {job.salary}</p>}

                                {/* Student Statistics */}
                                <div className="flex gap-3 mt-3 flex-wrap">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-md">
                                        <UserCheck className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-700">
                                            {job.stats?.eligible || 0} Eligible
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-md">
                                        <Users className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-700">
                                            {job.stats?.applied || 0} Applied
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-md">
                                        <UserX className="h-4 w-4 text-orange-600" />
                                        <span className="text-sm font-medium text-orange-700">
                                            {job.stats?.notApplied || 0} Not Applied
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 mt-3">
                                    Status:{' '}
                                    <span
                                        className={`font-semibold ${job.status === 'active' ? 'text-green-600' : 'text-gray-600'
                                            }`}
                                    >
                                        {job.status}
                                    </span>
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                    {jobs.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No active jobs found for your college.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
