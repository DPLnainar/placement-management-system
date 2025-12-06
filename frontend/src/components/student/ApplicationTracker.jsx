import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Building2,
    Calendar,
    ChevronRight
} from 'lucide-react';
import axios from 'axios';

const ApplicationTracker = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await axios.get('/api/students/applications');
            setApplications(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load applications');
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            under_review: 'bg-blue-100 text-blue-800 border-blue-300',
            shortlisted: 'bg-purple-100 text-purple-800 border-purple-300',
            aptitude_cleared: 'bg-indigo-100 text-indigo-800 border-indigo-300',
            technical_cleared: 'bg-cyan-100 text-cyan-800 border-cyan-300',
            hr_cleared: 'bg-teal-100 text-teal-800 border-teal-300',
            selected: 'bg-green-100 text-green-800 border-green-300',
            offered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            rejected: 'bg-red-100 text-red-800 border-red-300',
            withdrawn: 'bg-gray-100 text-gray-800 border-gray-300',
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getStatusIcon = (status) => {
        if (status === 'rejected' || status === 'withdrawn') {
            return <XCircle className="w-4 h-4" />;
        }
        if (status === 'selected' || status === 'offered') {
            return <CheckCircle2 className="w-4 h-4" />;
        }
        if (status === 'pending' || status === 'under_review') {
            return <Clock className="w-4 h-4" />;
        }
        return <AlertCircle className="w-4 h-4" />;
    };

    const getRoundProgress = (rounds, currentRound, status) => {
        const allRounds = [
            { name: 'Applied', type: 'application' },
            { name: 'Aptitude', type: 'aptitude' },
            { name: 'Technical', type: 'technical' },
            { name: 'HR', type: 'hr' },
            { name: 'Final', type: 'final' },
        ];

        return (
            <div className="flex items-center gap-2 mt-3">
                {allRounds.map((round, index) => {
                    const roundCompleted = rounds?.some(
                        r => r.roundType === round.type && r.status === 'cleared'
                    );
                    const isCurrentRound = currentRound === round.type;
                    const isPastRound = allRounds.findIndex(r => r.type === currentRound) > index;

                    return (
                        <React.Fragment key={round.type}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${roundCompleted || isPastRound
                                            ? 'bg-green-500 text-white'
                                            : isCurrentRound
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    {roundCompleted || isPastRound ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span className="text-xs mt-1 text-gray-600">{round.name}</span>
                            </div>
                            {index < allRounds.length - 1 && (
                                <ChevronRight className="w-4 h-4 text-gray-400 mb-5" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-center text-gray-500">Loading applications...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-center text-red-500">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (applications.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Application Tracker</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-500 py-8">
                        You haven't applied to any jobs yet. Start applying to track your progress here!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Application Tracker</h2>
            <p className="text-gray-600">Track the progress of your job applications</p>

            <div className="grid gap-4">
                {applications.map((application) => (
                    <Card key={application._id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Building2 className="w-5 h-5 text-gray-600" />
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {application.jobId?.title}
                                        </h3>
                                    </div>
                                    <p className="text-gray-600 font-medium">
                                        {application.jobId?.company}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Applied: {new Date(application.appliedAt).toLocaleDateString()}
                                        </span>
                                        {application.jobId?.ctc && (
                                            <span>₹{application.jobId.ctc} LPA</span>
                                        )}
                                    </div>
                                </div>
                                <Badge className={`${getStatusColor(application.status)} border flex items-center gap-1`}>
                                    {getStatusIcon(application.status)}
                                    {application.status.replace(/_/g, ' ').toUpperCase()}
                                </Badge>
                            </div>

                            {/* Round Progress */}
                            {getRoundProgress(application.rounds, application.currentRound, application.status)}

                            {/* Rejection Reason */}
                            {application.status === 'rejected' && application.rejectionReason && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                                    <p className="text-sm text-red-700">{application.rejectionReason}</p>
                                </div>
                            )}

                            {/* Round Details */}
                            {application.rounds && application.rounds.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Round Details:</p>
                                    <div className="space-y-2">
                                        {application.rounds.map((round, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                            >
                                                <span className="text-sm text-gray-700">
                                                    {round.roundName}
                                                </span>
                                                <Badge className={`text-xs ${getStatusColor(round.status)}`}>
                                                    {round.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ApplicationTracker;
