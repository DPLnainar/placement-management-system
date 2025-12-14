import React from 'react';
import JobCard from './JobCard';
import './JobList.css';

const JobList = ({ jobs, loading, onViewDetails, onApply, isPlaced, placementDetails }) => {
    if (loading) {
        return (
            <div className="job-list-loading">
                <div className="spinner"></div>
                <p>Loading jobs...</p>
            </div>
        );
    }

    if (!jobs || jobs.length === 0) {
        return (
            <div className="job-list-empty">
                <div className="empty-icon">📋</div>
                <h3>No Jobs Available</h3>
                <p>There are currently no active job postings for your college.</p>
            </div>
        );
    }

    // Separate eligible and not eligible jobs
    const eligibleJobs = jobs.filter(job => job.eligible);
    const notEligibleJobs = jobs.filter(job => !job.eligible);

    return (
        <div className="job-list-container">
            {/* Placement Lock Banner */}
            {isPlaced && placementDetails && (
                <div className="placement-lock-banner">
                    <div className="banner-icon">🎉</div>
                    <div className="banner-content">
                        <h3>Congratulations! You are already placed</h3>
                        <p>
                            Company: <strong>{placementDetails.companyName}</strong>
                            {placementDetails.placedAt && (
                                <span> • Placed on: {new Date(placementDetails.placedAt).toLocaleDateString('en-IN')}</span>
                            )}
                        </p>
                        <p className="banner-note">You cannot apply to new jobs as you are already placed.</p>
                    </div>
                </div>
            )}

            {/* Job Statistics */}
            <div className="job-stats">
                <div className="stat-card stat-total">
                    <span className="stat-number">{jobs.length}</span>
                    <span className="stat-label">Total Jobs</span>
                </div>
                <div className="stat-card stat-eligible">
                    <span className="stat-number">{eligibleJobs.length}</span>
                    <span className="stat-label">Eligible</span>
                </div>
                <div className="stat-card stat-not-eligible">
                    <span className="stat-number">{notEligibleJobs.length}</span>
                    <span className="stat-label">Not Eligible</span>
                </div>
            </div>

            {/* Eligible Jobs Section */}
            {eligibleJobs.length > 0 && (
                <div className="job-section">
                    <h2 className="section-title">
                        <span className="title-icon">✓</span>
                        Eligible Jobs ({eligibleJobs.length})
                    </h2>
                    <div className="job-list">
                        {eligibleJobs.map((job) => (
                            <JobCard
                                key={job.jobId}
                                job={job}
                                onViewDetails={onViewDetails}
                                onApply={onApply}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Not Eligible Jobs Section */}
            {notEligibleJobs.length > 0 && (
                <div className="job-section">
                    <h2 className="section-title not-eligible-title">
                        <span className="title-icon">ℹ</span>
                        Not Eligible Jobs ({notEligibleJobs.length})
                    </h2>
                    <p className="section-description">
                        These jobs are available but you don't meet the eligibility criteria.
                        Review the requirements to understand what's needed.
                    </p>
                    <div className="job-list">
                        {notEligibleJobs.map((job) => (
                            <JobCard
                                key={job.jobId}
                                job={job}
                                onViewDetails={onViewDetails}
                                onApply={onApply}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobList;
