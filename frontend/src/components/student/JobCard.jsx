import React from 'react';
import './JobCard.css';

const JobCard = ({ job, onViewDetails, onApply }) => {
    const {
        companyName,
        jobRole,
        title,
        packageLPA,
        stipend,
        location,
        skillsRequired,
        eligible,
        reasons,
        applyStatus,
        deadline,
        category,
        jobType
    } = job;

    const getApplyButtonConfig = () => {
        if (applyStatus === 'PLACED') {
            return {
                text: 'Already Placed',
                disabled: true,
                className: 'btn-placed',
                tooltip: 'You are already placed and cannot apply to new jobs'
            };
        }

        if (applyStatus === 'APPLIED') {
            return {
                text: 'Applied',
                disabled: true,
                className: 'btn-applied',
                tooltip: 'You have already applied to this job'
            };
        }

        if (!eligible) {
            return {
                text: 'Not Eligible',
                disabled: true,
                className: 'btn-not-eligible',
                tooltip: reasons.join(', ')
            };
        }

        return {
            text: 'Apply Now',
            disabled: false,
            className: 'btn-apply',
            tooltip: null
        };
    };

    const buttonConfig = getApplyButtonConfig();

    const formatDeadline = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const isDeadlineSoon = () => {
        if (!deadline) return false;
        const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 3 && daysLeft > 0;
    };

    return (
        <div className={`job-card ${!eligible ? 'job-card-ineligible' : ''}`}>
            {/* Eligibility Badge */}
            <div className="job-card-header">
                <div className="company-info">
                    <h3 className="company-name">{companyName}</h3>
                    <p className="job-title">{title || jobRole}</p>
                </div>
                <div className={`eligibility-badge ${eligible ? 'badge-eligible' : 'badge-not-eligible'}`}>
                    {eligible ? '✓ Eligible' : '✗ Not Eligible'}
                </div>
            </div>

            {/* Job Details */}
            <div className="job-details">
                <div className="detail-row">
                    <span className="detail-label">Package:</span>
                    <span className="detail-value">
                        {packageLPA ? `₹${packageLPA} LPA` : stipend ? `₹${stipend}/month` : 'Not Disclosed'}
                    </span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{location || 'N/A'}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                        {Array.isArray(category) ? category.join(', ') : jobType}
                    </span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Deadline:</span>
                    <span className={`detail-value ${isDeadlineSoon() ? 'deadline-soon' : ''}`}>
                        {formatDeadline(deadline)}
                        {isDeadlineSoon() && <span className="deadline-warning"> ⚠ Closing Soon</span>}
                    </span>
                </div>
            </div>

            {/* Skills */}
            {skillsRequired && skillsRequired.length > 0 && (
                <div className="skills-section">
                    <span className="skills-label">Skills:</span>
                    <div className="skills-list">
                        {skillsRequired.slice(0, 5).map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                        ))}
                        {skillsRequired.length > 5 && (
                            <span className="skill-tag more">+{skillsRequired.length - 5} more</span>
                        )}
                    </div>
                </div>
            )}

            {/* Ineligibility Reasons */}
            {!eligible && reasons && reasons.length > 0 && (
                <div className="ineligibility-reasons">
                    <p className="reasons-title">Reasons for Ineligibility:</p>
                    <ul className="reasons-list">
                        {reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Buttons */}
            <div className="job-card-actions">
                <button
                    className="btn btn-secondary"
                    onClick={() => onViewDetails(job)}
                >
                    View Details
                </button>
                <button
                    className={`btn ${buttonConfig.className}`}
                    disabled={buttonConfig.disabled}
                    onClick={() => !buttonConfig.disabled && onApply(job)}
                    title={buttonConfig.tooltip}
                >
                    {buttonConfig.text}
                </button>
            </div>
        </div>
    );
};

export default JobCard;
