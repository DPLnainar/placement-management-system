import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ProfileCompletionMeter = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/api/students/profile');
            setProfile(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            setLoading(false);
        }
    };

    const getCompletionSections = () => {
        if (!profile) return [];

        const sections = [
            {
                name: 'Personal Information',
                completed: !!(
                    profile.phoneNumber &&
                    profile.dateOfBirth &&
                    profile.gender &&
                    profile.currentAddress
                ),
                fields: ['Phone', 'Date of Birth', 'Gender', 'Address'],
            },
            {
                name: 'Academic Details',
                completed: !!(
                    profile.education?.tenth?.percentage &&
                    profile.education?.twelfth?.percentage &&
                    profile.education?.graduation?.cgpa
                ),
                fields: ['10th Marks', '12th Marks', 'College CGPA'],
            },
            {
                name: 'Skills',
                completed: !!(
                    profile.technicalSkills?.programming?.length > 0 ||
                    profile.technicalSkills?.frameworks?.length > 0 ||
                    profile.softSkills?.length > 0
                ),
                fields: ['Technical Skills', 'Soft Skills'],
            },
            {
                name: 'Projects',
                completed: profile.projects?.length >= 1,
                fields: ['At least 1 project'],
            },
            {
                name: 'Resume',
                completed: !!(profile.resumeUrl || profile.resume?.resumeUrl),
                fields: ['Resume uploaded'],
            },
        ];

        return sections;
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-center text-gray-500">Loading profile...</p>
                </CardContent>
            </Card>
        );
    }

    if (!profile) {
        return null;
    }

    const sections = getCompletionSections();
    const completedSections = sections.filter(s => s.completed).length;
    const percentage = profile.profileCompletionPercentage || 0;

    return (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                    Profile Completion
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Circular Progress */}
                <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-gray-200"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 56}`}
                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                                className={`${percentage >= 80
                                        ? 'text-green-500'
                                        : percentage >= 50
                                            ? 'text-yellow-500'
                                            : 'text-red-500'
                                    } transition-all duration-500`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-900">{percentage}%</p>
                                <p className="text-xs text-gray-600">Complete</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                            {completedSections} of {sections.length} sections completed
                        </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                </div>

                {/* Sections Checklist */}
                <div className="space-y-2 mt-4">
                    <p className="text-sm font-semibold text-gray-700">Sections:</p>
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${section.completed
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-gray-200'
                                }`}
                        >
                            <div className="mt-0.5">
                                {section.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p
                                    className={`text-sm font-medium ${section.completed ? 'text-green-900' : 'text-gray-700'
                                        }`}
                                >
                                    {section.name}
                                </p>
                                {!section.completed && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Required: {section.fields.join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                {percentage < 100 && (
                    <div className="mt-4 p-4 bg-blue-100 border border-blue-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-900">
                                Complete your profile to improve job eligibility
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                                A complete profile increases your chances of being shortlisted for jobs.
                            </p>
                        </div>
                    </div>
                )}

                {percentage === 100 && (
                    <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-semibold text-green-900">
                            Your profile is complete! 🎉
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProfileCompletionMeter;
