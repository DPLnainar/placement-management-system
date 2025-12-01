import React from 'react';
import { Calendar, Bell, Download, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { calendarIntegration } from '../utils/advancedFeatures';

/**
 * Enhanced Job Card with Advanced Features
 * Includes: Calendar Integration, Recommendations Badge, Quick Actions
 */
const EnhancedJobCard = ({ job, matchScore, recommendationReasons, onApply }) => {
    const handleAddToCalendar = (type) => {
        switch (type) {
            case 'google':
                calendarIntegration.addToGoogleCalendar(job);
                break;
            case 'outlook':
                calendarIntegration.addToOutlookCalendar(job);
                break;
            case 'ical':
                calendarIntegration.downloadICalFile(job);
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative">
            {/* Recommendation Badge */}
            {matchScore && matchScore >= 70 && (
                <div className="absolute -top-2 -right-2 z-10">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        {matchScore}% Match
                    </Badge>
                </div>
            )}

            {/* Job Card Content */}
            <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{job.companyName}</h3>
                        <p className="text-gray-600">{job.jobCategory}</p>
                    </div>

                    {/* Status Badges */}
                    <div className="flex gap-2">
                        {job.isEligible ? (
                            <Badge className="bg-green-100 text-green-700">Eligible</Badge>
                        ) : (
                            <Badge className="bg-orange-100 text-orange-700">Not Eligible</Badge>
                        )}
                        <Badge className={job.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                            {job.status}
                        </Badge>
                    </div>
                </div>

                {/* Recommendation Reasons */}
                {recommendationReasons && recommendationReasons.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Why this job matches you:</p>
                        <ul className="space-y-1">
                            {recommendationReasons.map((reason, index) => (
                                <li key={index} className="text-sm text-blue-700">{reason}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Job Details */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Location:</span>
                        {job.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Deadline:</span>
                        {new Date(job.deadline).toLocaleDateString()} at {new Date(job.deadline).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Type:</span>
                        {job.jobType === 'intern' ? '🎓 Internship' : '💼 Full-Time'}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {/* Apply Button */}
                    <Button
                        onClick={() => onApply(job.id)}
                        disabled={!job.isEligible || job.hasApplied}
                        className="flex-1"
                        variant={job.isEligible && !job.hasApplied ? 'default' : 'secondary'}
                    >
                        {job.hasApplied ? 'Already Applied' : job.isEligible ? 'Apply Now' : 'Not Eligible'}
                    </Button>

                    {/* Calendar Dropdown */}
                    {job.isEligible && !job.hasApplied && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Calendar className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAddToCalendar('google')}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Google Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAddToCalendar('outlook')}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Outlook Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAddToCalendar('ical')}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download iCal
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnhancedJobCard;
