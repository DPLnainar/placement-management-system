import React, { useState, useEffect } from 'react';
import { studentAPI, applicationAPI } from '../services/api';
import JobList from './student/JobList';
import JobDetailModal from './student/JobDetailModal';
import './StudentJobsPage.css';

const StudentJobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPlaced, setIsPlaced] = useState(false);
    const [placementDetails, setPlacementDetails] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        fetchJobs();
    }, [page]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await studentAPI.getJobs({ page, limit: 50 });

            if (response.data.success) {
                setJobs(response.data.jobs || []);
                setIsPlaced(response.data.isPlaced || false);
                setPlacementDetails(response.data.placementDetails);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError(err.response?.data?.message || 'Failed to load jobs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (job) => {
        setSelectedJob(job);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedJob(null);
    };

    const handleApply = async (job) => {
        if (!job.eligible) {
            alert('You are not eligible for this job.');
            return;
        }

        if (isPlaced) {
            alert('You are already placed and cannot apply to new jobs.');
            return;
        }

        if (job.applyStatus === 'APPLIED') {
            alert('You have already applied to this job.');
            return;
        }

        // Confirm application
        const confirmed = window.confirm(
            `Are you sure you want to apply for ${job.title} at ${job.companyName}?`
        );

        if (!confirmed) return;

        try {
            setLoading(true);

            // Create application
            const applicationData = {
                jobId: job.jobId,
                status: 'pending'
            };

            const response = await applicationAPI.create(applicationData);

            if (response.data) {
                alert('Application submitted successfully!');
                // Close modal if open
                handleCloseModal();
                // Refresh jobs to update apply status
                await fetchJobs();
            }
        } catch (error) {
            console.error('Error applying to job:', error);

            // Handle specific error cases
            if (error.response?.status === 400) {
                const errorMsg = error.response?.data?.message || 'Please complete your profile before applying to jobs';
                const missingFields = error.response?.data?.missingFields || [];

                if (missingFields.length > 0) {
                    const formattedFields = missingFields.map(f =>
                        f.replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim()
                    ).join(', ');

                    alert(`${errorMsg}\\n\\nMissing fields: ${formattedFields}\\n\\nPlease complete your profile before applying.`);
                } else {
                    alert(errorMsg);
                }
            } else {
                const errorMsg = error.response?.data?.message || error.message || 'Error submitting application';
                alert(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (pagination && page < pagination.totalPages) {
            setPage(page + 1);
        }
    };

    return (
        <div className="student-jobs-page">
            {/* Header */}
            <div className="page-header">
                <h1>Available Jobs</h1>
                <p className="page-subtitle">
                    Browse and apply to jobs from your college
                </p>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                    <button onClick={fetchJobs} className="retry-button">
                        Retry
                    </button>
                </div>
            )}

            {/* Job List */}
            <JobList
                jobs={jobs}
                loading={loading}
                onViewDetails={handleViewDetails}
                onApply={handleApply}
                isPlaced={isPlaced}
                placementDetails={placementDetails}
            />

            {/* Load More Button */}
            {pagination && page < pagination.totalPages && !loading && (
                <div className="load-more-container">
                    <button onClick={handleLoadMore} className="load-more-button">
                        Load More Jobs ({pagination.total - jobs.length} remaining)
                    </button>
                </div>
            )}

            {/* Job Detail Modal */}
            <JobDetailModal
                job={selectedJob}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onApply={handleApply}
            />
        </div>
    );
};

export default StudentJobsPage;
