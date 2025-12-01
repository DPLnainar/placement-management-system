// Advanced Features Integration Module
// This module provides calendar integration, notifications, and recommendations

import { eligibilityAPI, preferencesAPI, notificationAPI } from '../services/api';

/**
 * Calendar Integration
 * Adds job deadlines to user's calendar
 */
export const calendarIntegration = {
    /**
     * Generate iCal format for calendar event
     */
    generateICalEvent: (job) => {
        const deadline = new Date(job.deadline);
        const startDate = new Date(deadline.getTime() - 24 * 60 * 60 * 1000); // 1 day before

        const formatDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Placement Portal//Job Deadline//EN
BEGIN:VEVENT
UID:job-${job.id}-${Date.now()}@placementportal.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(deadline)}
SUMMARY:Job Application Deadline: ${job.companyName}
DESCRIPTION:Application deadline for ${job.jobCategory} position at ${job.companyName}.\\n\\nLocation: ${job.location}\\n\\nApply before: ${deadline.toLocaleString()}
LOCATION:${job.location}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
DESCRIPTION:Job application deadline tomorrow
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT2H
DESCRIPTION:Job application deadline in 2 hours
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

        return ical;
    },

    /**
     * Download iCal file
     */
    downloadICalFile: (job) => {
        const icalContent = calendarIntegration.generateICalEvent(job);
        const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `job-deadline-${job.companyName.replace(/\s+/g, '-')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * Add to Google Calendar
     */
    addToGoogleCalendar: (job) => {
        const deadline = new Date(job.deadline);
        const startDate = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);

        const formatGoogleDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const title = encodeURIComponent(`Job Deadline: ${job.companyName}`);
        const details = encodeURIComponent(`Application deadline for ${job.jobCategory} at ${job.companyName}\n\nLocation: ${job.location}`);
        const location = encodeURIComponent(job.location);
        const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(deadline)}`;

        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
        window.open(url, '_blank');
    },

    /**
     * Add to Outlook Calendar
     */
    addToOutlookCalendar: (job) => {
        const deadline = new Date(job.deadline);
        const startDate = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);

        const formatOutlookDate = (date) => {
            return date.toISOString();
        };

        const title = encodeURIComponent(`Job Deadline: ${job.companyName}`);
        const body = encodeURIComponent(`Application deadline for ${job.jobCategory} at ${job.companyName}\n\nLocation: ${job.location}`);
        const location = encodeURIComponent(job.location);
        const startTime = formatOutlookDate(startDate);
        const endTime = formatOutlookDate(deadline);

        const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${body}&location=${location}&startdt=${startTime}&enddt=${endTime}`;
        window.open(url, '_blank');
    }
};

/**
 * Job Recommendations Engine
 * AI-powered job suggestions based on student profile
 */
export const recommendationsEngine = {
    /**
     * Fetch personalized job recommendations
     */
    getRecommendations: async (limit = 10) => {
        try {
            const response = await eligibilityAPI.getJobRecommendations(limit);
            return response.data.data.recommendations;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            return [];
        }
    },

    /**
     * Calculate match score locally (fallback)
     */
    calculateMatchScore: (job, studentProfile) => {
        let score = 0;
        const weights = {
            eligibility: 40,
            skills: 30,
            location: 15,
            companyTier: 10,
            jobType: 5
        };

        // Eligibility check
        if (studentProfile.cgpa >= (job.cgpa || 0) &&
            studentProfile.tenthPercentage >= (job.tenthPercentage || 0) &&
            studentProfile.twelfthPercentage >= (job.twelfthPercentage || 0)) {
            score += weights.eligibility;
        }

        // Skills match
        if (job.skills && studentProfile.skills) {
            const jobSkills = Object.keys(job.skills).filter(k => job.skills[k] && k !== 'others');
            const studentSkills = studentProfile.skills || [];
            const matchedSkills = jobSkills.filter(skill =>
                studentSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
            );
            const skillMatchRatio = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0;
            score += weights.skills * skillMatchRatio;
        }

        // Location preference
        if (studentProfile.preferredLocations && studentProfile.preferredLocations.includes(job.location)) {
            score += weights.location;
        }

        // Company tier
        if (job.companyTier === 'super_dream') score += weights.companyTier;
        else if (job.companyTier === 'dream') score += weights.companyTier * 0.7;

        // Job type preference
        if (studentProfile.preferredJobType && job.jobType === studentProfile.preferredJobType) {
            score += weights.jobType;
        }

        return Math.round(score);
    },

    /**
     * Get recommendation reasons
     */
    getRecommendationReasons: (job, studentProfile) => {
        const reasons = [];

        if (studentProfile.cgpa >= (job.cgpa || 0)) {
            reasons.push('✓ Meets CGPA requirement');
        }

        if (job.skills && studentProfile.skills) {
            const jobSkills = Object.keys(job.skills).filter(k => job.skills[k] && k !== 'others');
            const studentSkills = studentProfile.skills || [];
            const matchedSkills = jobSkills.filter(skill =>
                studentSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
            );
            if (matchedSkills.length > 0) {
                reasons.push(`✓ ${matchedSkills.length} matching skills`);
            }
        }

        if (studentProfile.preferredLocations && studentProfile.preferredLocations.includes(job.location)) {
            reasons.push('✓ Preferred location');
        }

        if (job.companyTier === 'super_dream' || job.companyTier === 'dream') {
            reasons.push(`✓ ${job.companyTier === 'super_dream' ? 'Super Dream' : 'Dream'} company`);
        }

        return reasons;
    }
};

/**
 * Notification Manager
 * Handles email and push notifications
 */
export const notificationManager = {
    /**
     * Check for new eligible jobs and notify
     */
    checkNewEligibleJobs: async (lastCheckTime) => {
        try {
            const response = await eligibilityAPI.getEligibleJobs();
            const eligibleJobs = response.data.data.jobs;

            const newJobs = eligibleJobs.filter(job =>
                new Date(job.createdAt) > new Date(lastCheckTime)
            );

            if (newJobs.length > 0) {
                notificationManager.createNotification({
                    title: 'New Eligible Jobs Available!',
                    message: `${newJobs.length} new job${newJobs.length > 1 ? 's' : ''} match your profile`,
                    type: 'new_jobs',
                    data: newJobs
                });
            }

            return newJobs;
        } catch (error) {
            console.error('Error checking new jobs:', error);
            return [];
        }
    },

    /**
     * Create a notification
     */
    createNotification: (notification) => {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const newNotification = {
            id: Date.now().toString(),
            ...notification,
            read: false,
            createdAt: new Date().toISOString()
        };
        notifications.unshift(newNotification);
        localStorage.setItem('notifications', JSON.stringify(notifications));

        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/logo192.png',
                badge: '/logo192.png'
            });
        }

        return newNotification;
    },

    /**
     * Request notification permission
     */
    requestPermission: async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    },

    /**
     * Notify about upcoming deadlines
     */
    notifyUpcomingDeadlines: (jobs) => {
        const now = new Date();
        const upcomingSoon = jobs.filter(job => {
            if (!job.deadline || job.hasApplied) return false;
            const deadline = new Date(job.deadline);
            const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
            return hoursUntilDeadline > 0 && hoursUntilDeadline <= 24;
        });

        if (upcomingSoon.length > 0) {
            upcomingSoon.forEach(job => {
                const deadline = new Date(job.deadline);
                const hoursLeft = Math.round((deadline - now) / (1000 * 60 * 60));

                notificationManager.createNotification({
                    title: 'Application Deadline Soon!',
                    message: `${job.companyName} - ${hoursLeft} hours left to apply`,
                    type: 'deadline_warning',
                    data: job
                });
            });
        }
    }
};

/**
 * Filter Preferences Manager
 * Save and restore user filter preferences
 */
export const filterPreferences = {
    /**
     * Save current filter state
     */
    saveFilters: async (filters) => {
        try {
            await preferencesAPI.saveFilters(filters);
            return true;
        } catch (error) {
            console.error('Error saving filters:', error);
            return false;
        }
    },

    /**
     * Load saved filters
     */
    loadFilters: async () => {
        try {
            const response = await preferencesAPI.getFilters();
            return response.data || {};
        } catch (error) {
            console.error('Error loading filters:', error);
            return {};
        }
    },

    /**
     * Clear saved filters
     */
    clearFilters: async () => {
        try {
            await preferencesAPI.saveFilters({});
            return true;
        } catch (error) {
            console.error('Error clearing filters:', error);
            return false;
        }
    }
};

export default {
    calendarIntegration,
    recommendationsEngine,
    notificationManager,
    filterPreferences
};
