import React from 'react';
import './JobDetailModal.css';

const JobDetailModal = ({ job, isOpen, onClose, onApply }) => {
    if (!isOpen || !job) return null;

    const {
        companyName,
        jobRole,
        title,
        description,
        packageLPA,
        stipend,
        location,
        workLocation,
        workMode,
        skillsRequired,
        hiringRounds,
        attachments,
        eligible,
        reasons,
        applyStatus,
        deadline,
        registrationDeadline,
        jobType,
        category,
        assessmentLink,
        assessmentRequired
    } = job;

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const canApply = eligible && applyStatus === 'NOT_APPLIED';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div>
                        <h2>{companyName}</h2>
                        <p className="modal-subtitle">{title || jobRole}</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {/* Eligibility Status */}
                    <div className={`eligibility-status ${eligible ? 'status-eligible' : 'status-not-eligible'}`}>
                        <strong>{eligible ? '✓ You are eligible' : '✗ Not Eligible'}</strong>
                        {!eligible && reasons && reasons.length > 0 && (
                            <ul className="modal-reasons">
                                {reasons.map((reason, index) => (
                                    <li key={index}>{reason}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Job Information */}
                    <div className="info-section">
                        <h3>Job Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Package:</span>
                                <span className="info-value">
                                    {packageLPA ? `₹${packageLPA} LPA` : stipend ? `₹${stipend}/month` : 'Not Disclosed'}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Location:</span>
                                <span className="info-value">{location || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Work Mode:</span>
                                <span className="info-value">{workMode || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Job Type:</span>
                                <span className="info-value">
                                    {Array.isArray(category) ? category.join(', ') : jobType}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Application Deadline:</span>
                                <span className="info-value">{formatDate(deadline)}</span>
                            </div>
                            {registrationDeadline && (
                                <div className="info-item">
                                    <span className="info-label">Registration Deadline:</span>
                                    <span className="info-value">{formatDate(registrationDeadline)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {description && (
                        <div className="info-section">
                            <h3>Job Description</h3>
                            <p className="job-description">{description}</p>
                        </div>
                    )}

                    {/* Skills Required */}
                    {skillsRequired && skillsRequired.length > 0 && (
                        <div className="info-section">
                            <h3>Skills Required</h3>
                            <div className="modal-skills">
                                {skillsRequired.map((skill, index) => (
                                    <span key={index} className="modal-skill-tag">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hiring Rounds */}
                    {hiringRounds && hiringRounds.length > 0 && (
                        <div className="info-section">
                            <h3>Hiring Process</h3>
                            <ol className="hiring-rounds">
                                {hiringRounds.map((round, index) => (
                                    <li key={index}>
                                        <strong>{round.roundName}</strong>
                                        {round.roundType && <span className="round-type"> ({round.roundType})</span>}
                                        {round.description && <p className="round-desc">{round.description}</p>}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Assessment */}
                    {assessmentRequired && assessmentLink && (
                        <div className="info-section">
                            <h3>Assessment</h3>
                            <p>This job requires completing an assessment.</p>
                            <a href={assessmentLink} target="_blank" rel="noopener noreferrer" className="assessment-link">
                                Open Assessment Link →
                            </a>
                        </div>
                    )}

                    {/* Attachments */}
                    {attachments && attachments.length > 0 && (
                        <div className="info-section">
                            <h3>Attachments</h3>
                            <div className="attachments-list">
                                {attachments.map((attachment, index) => (
                                    <a
                                        key={index}
                                        href={attachment.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="attachment-item"
                                    >
                                        <span className="attachment-icon">📎</span>
                                        <span className="attachment-name">{attachment.fileName}</span>
                                        <span className="attachment-action">Download</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                    {canApply && (
                        <button className="btn btn-primary" onClick={() => onApply(job)}>
                            Apply Now
                        </button>
                    )}
                    {applyStatus === 'APPLIED' && (
                        <button className="btn btn-applied" disabled>
                            Already Applied
                        </button>
                    )}
                    {applyStatus === 'PLACED' && (
                        <button className="btn btn-placed" disabled>
                            Already Placed
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobDetailModal;
