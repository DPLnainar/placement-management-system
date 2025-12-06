import React, { useState, useEffect } from 'react';
import { applicationAPI } from '../services/api';
import { CheckCircle2, XCircle, Circle, AlertCircle, Building, Clock } from 'lucide-react';

export default function ApplicationTracker() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await applicationAPI.getAll();
            const apps = response.data.applications || response.data || [];
            setApplications(apps);
        } catch (err) {
            console.error('Failed to fetch applications', err);
            setError('Failed to load applications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const updated = new Date(date);
        const diffMs = now - updated;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1d';
        if (diffDays < 7) return `${diffDays}d`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
        return `${Math.floor(diffDays / 30)}mo`;
    };

    const getStatusBadgeColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PLACED': return 'bg-green-600 text-white';
            case 'OFFERED': return 'bg-blue-600 text-white';
            case 'REJECTED': return 'bg-red-600 text-white';
            case 'SHORTLISTED': return 'bg-purple-600 text-white';
            case 'TECHNICAL_SCHEDULED':
            case 'TECHNICAL_CLEARED':
            case 'TECHNICAL': return 'bg-orange-600 text-white';
            case 'HR_SCHEDULED':
            case 'HR_CLEARED':
            case 'HR': return 'bg-indigo-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    const renderTimeline = (app) => {
        const steps = ['Applied', 'Shortlisted', 'Technical', 'HR', 'Offer'];
        const currentStatus = app.status?.toUpperCase();

        // Determine which step is active based on status
        let activeStep = 0;
        if (currentStatus?.includes('SHORTLISTED')) activeStep = 1;
        else if (currentStatus?.includes('TECHNICAL')) activeStep = 2;
        else if (currentStatus?.includes('HR')) activeStep = 3;
        else if (currentStatus?.includes('OFFERED') || currentStatus?.includes('PLACED')) activeStep = 4;

        const isRejected = currentStatus?.includes('REJECTED');

        return (
            <div className="flex items-center gap-2 text-sm">
                {steps.map((step, index) => {
                    let icon;
                    let color = 'text-gray-300';

                    if (isRejected && index === activeStep) {
                        icon = <XCircle size={16} className="text-red-600" />;
                        color = 'text-red-600';
                    } else if (index < activeStep || (index === activeStep && !isRejected && activeStep === 4)) {
                        icon = <CheckCircle2 size={16} className="text-green-600" />;
                        color = 'text-green-600';
                    } else if (index === activeStep && !isRejected) {
                        icon = <Circle size={16} className="text-blue-600 fill-blue-600" />;
                        color = 'text-blue-600 font-semibold';
                    } else {
                        icon = <Circle size={16} className="text-gray-300" />;
                    }

                    return (
                        <React.Fragment key={step}>
                            <div className="flex items-center gap-1">
                                {icon}
                                <span className={color}>{step}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <span className="text-gray-400">→</span>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-md flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <Building className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No Applications Yet</h3>
                    <p className="text-gray-500 max-w-sm">
                        You haven't applied to any placement drives yet. Explore available jobs and start applying!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {applications.map((app) => (
                <div
                    key={app._id}
                    className={`border rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${app.status?.toUpperCase() === 'PLACED' ? 'border-green-500 bg-green-50/30' :
                            app.status?.toUpperCase()?.includes('REJECTED') ? 'border-red-200 bg-red-50/20' :
                                'border-gray-200'
                        }`}
                >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {app.jobId?.company?.charAt(0) || 'C'}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{app.jobId?.company || 'Unknown Company'}</h3>
                                <p className="text-sm text-gray-500">{app.jobId?.title || 'Unknown Role'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(app.status)}`}>
                                {app.status || 'PENDING'}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={14} />
                                {getTimeAgo(app.updatedAt || app.appliedAt)}
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="mb-3">
                        {renderTimeline(app)}
                    </div>

                    {/* Rejection Reason */}
                    {app.rejectionReason && (
                        <div className="mt-3 p-2 bg-red-50 border-l-4 border-red-500 rounded">
                            <p className="text-xs text-red-800">
                                <span className="font-semibold">Reason:</span> {app.rejectionReason}
                            </p>
                        </div>
                    )}

                    {/* Round Feedback */}
                    {app.rounds && app.rounds.length > 0 && (
                        <div className="mt-3 text-xs text-gray-600">
                            <details className="cursor-pointer">
                                <summary className="font-medium hover:text-gray-900">View Round Details ({app.rounds.length})</summary>
                                <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
                                    {app.rounds.map((round, idx) => (
                                        <div key={idx}>
                                            <p className="font-medium text-gray-900">{round.roundName}</p>
                                            {round.feedback && <p className="text-gray-600">{round.feedback}</p>}
                                            {round.completedDate && (
                                                <p className="text-gray-400">{new Date(round.completedDate).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
