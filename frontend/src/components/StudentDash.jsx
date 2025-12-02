import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, applicationAPI, userAPI, uploadAPI } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Briefcase, LogOut, MapPin, Calendar, User, Save, Upload, Plus, Trash2, FileText, Download, Menu, X, Printer, ExternalLink } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { ResumeTemplate } from './ResumeTemplate';

// Helper function to get inline viewable URL for Cloudinary files
const getInlineViewUrl = (url) => {
  if (!url) return url;
  
  // For Cloudinary PDF URLs, add transformation to ensure inline display
  if (url.includes('cloudinary.com') && url.includes('.pdf')) {
    // Convert image resource type to raw and add fl_attachment:false transformation
    let fixedUrl = url.replace('/image/upload/', '/raw/upload/');
    // Add fl_attachment:false transformation to force inline display instead of download
    const urlParts = fixedUrl.split('/upload/');
    if (urlParts.length === 2) {
      return `${urlParts[0]}/upload/fl_attachment:false/${urlParts[1]}`;
    }
  }
  
  // For Google Drive links, ensure they use preview format
  if (url.includes('drive.google.com') && url.includes('/file/d/')) {
    const fileId = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }
  
  return url;
};

export default function StudentDash() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [profileTab, setProfileTab] = useState('personal');
  const [resumeFile, setResumeFile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPersonalLocked, setIsPersonalLocked] = useState(false);
  const [isAcademicLocked, setIsAcademicLocked] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [missingProfileFields, setMissingProfileFields] = useState([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const [profileData, setProfileData] = useState({
    // Personal Information
    primaryEmail: '',
    secondaryEmail: '',
    primaryPhone: '',
    secondaryPhone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',

    // Passport Details (Optional)
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    passportPlaceOfIssue: '',

    // Academic Information
    cgpa: '',
    tenthPercentage: '',
    tenthBoard: '',
    tenthYear: '',
    tenthInstitution: '',
    twelfthPercentage: '',
    twelfthBoard: '',
    twelfthYear: '',
    twelfthInstitution: '',

    // Current Education
    degree: '',
    branch: '',
    semester: '',
    currentInstitution: '',
    backlogs: '',

    // Professional Links
    github: '',
    linkedin: '',
    portfolio: '',

    // Resume
    resumeLink: '',
  });

  const [semesterWiseGPA, setSemesterWiseGPA] = useState([
    { semester: 1, cgpa: '', sgpa: '' },
    { semester: 2, cgpa: '', sgpa: '' },
    { semester: 3, cgpa: '', sgpa: '' },
    { semester: 4, cgpa: '', sgpa: '' },
    { semester: 5, cgpa: '', sgpa: '' },
    { semester: 6, cgpa: '', sgpa: '' },
    { semester: 7, cgpa: '', sgpa: '' },
    { semester: 8, cgpa: '', sgpa: '' },
  ]);

  const [currentArrears, setCurrentArrears] = useState('');
  const [arrearHistory, setArrearHistory] = useState('');

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [skillCategory, setSkillCategory] = useState('technical'); // technical, soft, tools, languages

  const [internships, setInternships] = useState([]);
  const [newInternship, setNewInternship] = useState({
    company: '',
    role: '',
    duration: '',
    description: '',
    location: '',
  });

  const [extracurricular, setExtracurricular] = useState([]);
  const [newActivity, setNewActivity] = useState({
    title: '',
    role: '',
    duration: '',
    description: '',
    description: '',
  });

  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    title: '',
    techStack: '',
    date: '',
    link: '',
    description: ''
  });

  const resumeRef = React.useRef();
  const handlePrint = useReactToPrint({
    content: () => resumeRef.current,
    documentTitle: `${user?.username || 'Student'}_Resume`,
  });

  const addProject = () => {
    if (newProject.title && newProject.description) {
      setProjects([...projects, { ...newProject, id: Date.now() }]);
      setNewProject({ title: '', techStack: '', date: '', link: '', description: '' });
    }
  };

  const removeProject = (id) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchProfile();
  }, []);

  const checkProfileCompletion = (userData) => {
    const requiredFields = {
      phoneNumber: userData.primaryPhone,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      currentAddress: userData.address,
      cgpa: userData.cgpa,
      tenthPercentage: userData.tenthPercentage,
      twelfthPercentage: userData.twelfthPercentage,
      branch: userData.branch,
      yearOfStudy: userData.semester,
      rollNumber: userData.rollNumber || user?.username, // fallback to username
    };

    const missing = [];
    Object.entries(requiredFields).forEach(([field, value]) => {
      if (!value || value === '' || value === null) {
        missing.push(field);
      }
    });

    setMissingProfileFields(missing);
    setIsProfileComplete(missing.length === 0);

    return missing.length === 0;
  };

  const fetchProfile = async () => {
    try {
      const userId = user?.id;
      if (!userId) {
        return;
      }

      const response = await userAPI.getById(userId);

      const currentUser = response.data.data || response.data;

      if (currentUser) {

        // Check if critical data is already filled (data is locked after first save)
        // Check if critical data is already filled (data is locked after first save)
        const hasPersonalData = currentUser.primaryEmail || currentUser.dateOfBirth || currentUser.gender;
        const hasAcademicData = currentUser.cgpa || currentUser.tenthPercentage || currentUser.twelfthPercentage || currentUser.branch;

        setIsPersonalLocked(!!hasPersonalData);
        setIsAcademicLocked(!!hasAcademicData);

        // Populate profile data
        setProfileData({
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          primaryEmail: currentUser.primaryEmail || currentUser.email || '',
          secondaryEmail: currentUser.secondaryEmail || '',
          primaryPhone: currentUser.primaryPhone || '',
          secondaryPhone: currentUser.secondaryPhone || '',
          dateOfBirth: currentUser.dateOfBirth ? currentUser.dateOfBirth.split('T')[0] : '',
          gender: currentUser.gender || '',
          nationality: currentUser.nationality || '',
          address: currentUser.address || '',
          passportNumber: currentUser.passportNumber || '',
          passportPlaceOfIssue: currentUser.passportPlaceOfIssue || '',
          passportIssueDate: currentUser.passportIssueDate ? currentUser.passportIssueDate.split('T')[0] : '',
          passportExpiryDate: currentUser.passportExpiryDate ? currentUser.passportExpiryDate.split('T')[0] : '',
          tenthInstitution: currentUser.tenthInstitution || '',
          tenthPercentage: currentUser.tenthPercentage || '',
          tenthBoard: currentUser.tenthBoard || '',
          tenthYear: currentUser.tenthYear || '',
          twelfthInstitution: currentUser.twelfthInstitution || '',
          twelfthPercentage: currentUser.twelfthPercentage || '',
          twelfthBoard: currentUser.twelfthBoard || '',
          twelfthYear: currentUser.twelfthYear || '',
          currentInstitution: currentUser.currentInstitution || '',
          degree: currentUser.degree || '',
          branch: currentUser.branch || '',
          semester: currentUser.semester || '',
          cgpa: currentUser.cgpa || '',
          backlogs: currentUser.backlogs || '',
          github: currentUser.github || '',
          linkedin: currentUser.linkedin || '',
          portfolio: currentUser.portfolio || '',
          resumeLink: currentUser.resumeLink || '',
        });

        // Populate semester-wise GPA
        if (currentUser.semesterWiseGPA && Array.isArray(currentUser.semesterWiseGPA) && currentUser.semesterWiseGPA.length > 0) {
          setSemesterWiseGPA(currentUser.semesterWiseGPA);
        }

        // Populate arrear data
        setCurrentArrears(currentUser.currentArrears || '');
        setArrearHistory(currentUser.arrearHistory || '');

        // Populate skills
        if (currentUser.skills && Array.isArray(currentUser.skills) && currentUser.skills.length > 0) {
          setSkills(currentUser.skills.map((skill, idx) => ({
            ...skill,
            id: skill._id || idx
          })));
        }

        // Populate internships
        if (currentUser.internships && Array.isArray(currentUser.internships) && currentUser.internships.length > 0) {
          setInternships(currentUser.internships.map((intern, idx) => ({
            ...intern,
            id: intern._id || idx
          })));
        }

        // Populate extracurricular
        if (currentUser.extracurricular && Array.isArray(currentUser.extracurricular) && currentUser.extracurricular.length > 0) {
          setExtracurricular(currentUser.extracurricular.map((activity, idx) => ({
            ...activity,
            id: activity._id || idx
          })));
        }

        // Populate projects
        if (currentUser.projects && Array.isArray(currentUser.projects) && currentUser.projects.length > 0) {
          setProjects(currentUser.projects.map((project, idx) => ({
            ...project,
            id: project._id || idx
          })));
        }

        // Check profile completion
        checkProfileCompletion(currentUser);

        // Set resume file state if exists
        if (currentUser.resumeFile) {
          setResumeFile({
            name: 'Current Resume (Uploaded)',
            url: currentUser.resumeFile
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't show alert for profile fetch errors, just log it
    }
  };

  const handleSemesterGPAChange = (index, field, value) => {
    const updated = [...semesterWiseGPA];
    updated[index] = { ...updated[index], [field]: value };
    setSemesterWiseGPA(updated);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const userId = user?.id;
      if (!userId) {
        alert('User not found. Please login again.');
        return;
      }

      // Prepare profile data
      const profileUpdateData = {
        fullName: profileData.fullName,
        email: profileData.email,
        primaryEmail: profileData.primaryEmail,
        secondaryEmail: profileData.secondaryEmail,
        primaryPhone: profileData.primaryPhone,
        secondaryPhone: profileData.secondaryPhone,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        nationality: profileData.nationality,
        address: profileData.address,

        // Passport details
        passportNumber: profileData.passportNumber,
        passportPlaceOfIssue: profileData.passportPlaceOfIssue,
        passportIssueDate: profileData.passportIssueDate,
        passportExpiryDate: profileData.passportExpiryDate,

        // Academic details
        tenthInstitution: profileData.tenthInstitution,
        tenthPercentage: profileData.tenthPercentage,
        tenthBoard: profileData.tenthBoard,
        tenthYear: profileData.tenthYear,
        twelfthInstitution: profileData.twelfthInstitution,
        twelfthPercentage: profileData.twelfthPercentage,
        twelfthBoard: profileData.twelfthBoard,
        twelfthYear: profileData.twelfthYear,
        currentInstitution: profileData.currentInstitution,
        degree: profileData.degree,
        branch: profileData.branch,
        semester: profileData.semester,
        cgpa: profileData.cgpa,
        backlogs: profileData.backlogs,

        // Semester-wise CGPA
        semesterWiseGPA: semesterWiseGPA,

        // Arrear data
        currentArrears: currentArrears,
        arrearHistory: arrearHistory,

        // Skills
        skills: skills,

        // Professional links
        github: profileData.github,
        linkedin: profileData.linkedin,
        portfolio: profileData.portfolio,

        // Internships and extracurricular
        internships: internships,
        extracurricular: extracurricular,
        projects: projects,

        // Resume
        resumeLink: profileData.resumeLink,
      };

      // Call API to update user profile
      const response = await userAPI.update(userId, profileUpdateData);

      // Check if backend returned a locked field error
      if (response.data && response.data.lockedFields) {
        alert(`Cannot update: ${response.data.message}\n\nLocked fields: ${response.data.lockedFields.join(', ')}`);
        return;
      }

      // Set data as locked after first successful save based on active tab
      if (profileTab === 'personal') {
        setIsPersonalLocked(true);
      } else if (profileTab === 'academic') {
        setIsAcademicLocked(true);
      }

      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Error saving profile. Please try again.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size should be less than 5MB');
        return;
      }
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('resume', file);

        const response = await uploadAPI.uploadResume(formData);

        if (response.data.success) {
          setResumeFile(file);
          alert('Resume uploaded successfully!');
          // Refresh profile to get updated URL if needed
          fetchProfile();
        }
      } catch (error) {
        console.error('Error uploading resume:', error);
        alert(error.response?.data?.message || 'Error uploading resume');
      }
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { name: newSkill.trim(), category: skillCategory, id: Date.now() }]);
      setNewSkill('');
    }
  };

  const removeSkill = (id) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };

  const updateSemesterGPA = (index, field, value) => {
    const updated = [...semesterWiseGPA];
    updated[index][field] = value;

    // If SGPA is updated, calculate cumulative CGPA for that semester and overall CGPA
    if (field === 'sgpa') {
      // Calculate cumulative CGPA up to this semester
      let totalGradePoints = 0;
      let semesterCount = 0;

      for (let i = 0; i <= index; i++) {
        const sgpa = parseFloat(updated[i].sgpa);
        if (sgpa && sgpa > 0) {
          totalGradePoints += sgpa;
          semesterCount++;
        }
      }

      if (semesterCount > 0) {
        updated[index].cgpa = (totalGradePoints / semesterCount).toFixed(2);
      }
    }

    setSemesterWiseGPA(updated);

    // Calculate overall CGPA from all SGPA values
    const validSGPAs = updated.filter(sem => sem.sgpa && parseFloat(sem.sgpa) > 0);
    if (validSGPAs.length > 0) {
      const totalSGPA = validSGPAs.reduce((sum, sem) => sum + parseFloat(sem.sgpa), 0);
      const calculatedCGPA = (totalSGPA / validSGPAs.length).toFixed(2);
      setProfileData({ ...profileData, cgpa: calculatedCGPA });
    }
  };

  const addInternship = () => {
    if (newInternship.company && newInternship.role) {
      setInternships([...internships, { ...newInternship, id: Date.now() }]);
      setNewInternship({
        company: '',
        role: '',
        duration: '',
        description: '',
        location: '',
      });
    } else {
      alert('Please fill company name and role');
    }
  };

  const removeInternship = (id) => {
    setInternships(internships.filter(item => item.id !== id));
  };

  const addActivity = () => {
    if (newActivity.title) {
      setExtracurricular([...extracurricular, { ...newActivity, id: Date.now() }]);
      setNewActivity({
        title: '',
        role: '',
        duration: '',
        description: '',
      });
    } else {
      alert('Please fill activity title');
    }
  };

  const removeActivity = (id) => {
    setExtracurricular(extracurricular.filter(item => item.id !== id));
  };

  const generateResume = () => {
    alert('Resume builder coming soon! This will generate a professional resume based on your profile data.');
    // TODO: Implement resume generation functionality
  };

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getAll('active');
      // Handle API response structure - jobs are nested in .data.jobs or .data
      const jobsData = Array.isArray(response.data) ? response.data : (response.data.jobs || []);
      setJobs(jobsData);
      setFilteredJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Error loading jobs. Please refresh the page.');
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await applicationAPI.getAll();
      // Handle API response structure - applications might be nested
      const applicationsData = Array.isArray(response.data)
        ? response.data
        : (response.data.data || response.data.applications || []);
      const jobIds = new Set(applicationsData.map(app => app.jobId));
      setAppliedJobs(jobIds);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    try {
      const response = await applicationAPI.create({ jobId });
      alert('Application submitted successfully!');
      setAppliedJobs(prev => new Set([...prev, jobId]));
    } catch (error) {
      console.error('Error applying to job:', error);
      console.error('Error response:', error.response);

      // Check if it's a profile incomplete error
      if (error.response?.data?.profileIncomplete) {
        const errorMsg = error.response?.data?.message || 'Please complete your profile before applying to jobs';
        const missingFields = error.response?.data?.missingFields || [];

        if (missingFields.length > 0) {
          const formattedFields = missingFields.map(f =>
            f.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim()
          ).join(', ');

          const confirmSwitch = window.confirm(
            `${errorMsg}\n\nMissing fields: ${formattedFields}\n\nWould you like to go to your profile to complete these details?`
          );

          if (confirmSwitch) {
            setActiveTab('profile');
          }
        } else {
          const confirmSwitch = window.confirm(
            `${errorMsg}\n\nWould you like to go to your profile to complete these details?`
          );

          if (confirmSwitch) {
            setActiveTab('profile');
          }
        }
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Error submitting application';
        alert(errorMsg);
      }
    } finally {
      setApplyingJobId(null);
    }
  };

  const isJobExpired = (job) => {
    if (!job.deadline) return false;
    const deadline = new Date(job.deadline);
    return deadline < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Burger Menu */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Burger Menu Button (Mobile) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Welcome, {user?.fullName} • {user?.collegeName ? `${user.collegeName} • ` : ''}{user?.department}
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={() => logout()} className="hidden sm:flex">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
            <Button variant="outline" onClick={() => logout()} className="sm:hidden p-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t pt-4">
              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('jobs');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${activeTab === 'jobs'
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                    } px-4 py-3 text-left font-medium text-sm flex items-center gap-3 rounded-r`}
                >
                  <Briefcase className="h-5 w-5" />
                  Available Jobs
                </button>
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${activeTab === 'profile'
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                    } px-4 py-3 text-left font-medium text-sm flex items-center gap-3 rounded-r`}
                >
                  <User className="h-5 w-5" />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setActiveTab('resume-builder');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${activeTab === 'resume-builder'
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                    } px-4 py-3 text-left font-medium text-sm flex items-center gap-3 rounded-r`}
                >
                  <FileText className="h-5 w-5" />
                  Resume Builder
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Desktop Tabs */}
        <div className="mb-6 border-b border-gray-200 hidden lg:block">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`${activeTab === 'jobs'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Briefcase className="h-4 w-4" />
              Available Jobs
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`${activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <User className="h-4 w-4" />
              My Profile
            </button>
            <button
              onClick={() => setActiveTab('resume-builder')}
              className={`${activeTab === 'resume-builder'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <FileText className="h-4 w-4" />
              Resume Builder
            </button>
          </nav>
        </div>

        {/* Profile Incomplete Warning Banner */}
        {!isProfileComplete && activeTab === 'jobs' && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Complete Your Profile to Apply for Jobs
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You need to complete your profile before you can apply for jobs.
                    Missing {missingProfileFields.length} required field(s).
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Complete Profile Now →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <>
            {/* Stats Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Available Opportunities</CardTitle>
                <CardDescription>Active job postings for your college</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">{filteredJobs.length}</div>
                <p className="text-sm text-gray-600 mt-1">Open positions</p>
              </CardContent>
            </Card>

            {/* Jobs List */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Job Postings</h2>
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <Card key={job._id || job.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{String(job.company || job.companyName || 'N/A')}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <MapPin className="h-4 w-4" />
                            {String(job.location || 'N/A')}
                          </CardDescription>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {job.status === 'active' ? 'Active' : 'Closed'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700">Job Title</h4>
                          <p className="text-sm">{String(job.title || job.jobCategory || 'N/A')}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-gray-700">Description</h4>
                          <p className="text-sm text-gray-600">{String(job.description || job.jobDescription || 'N/A')}</p>
                        </div>

                        {job.salary && (
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700">Salary/CTC</h4>
                            <p className="text-sm">{String(job.salary)}</p>
                          </div>
                        )}

                        {job.jobType && (
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700">Job Type</h4>
                            <p className="text-sm capitalize">{String(job.jobType)}</p>
                          </div>
                        )}

                        {job.requirements && typeof job.requirements === 'string' && (
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700">Requirements</h4>
                            <p className="text-sm text-gray-600">{job.requirements}</p>
                          </div>
                        )}

                        {job.deadline && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                          </div>
                        )}

                        <div className="pt-4">
                          <Button
                            className="w-full"
                            disabled={appliedJobs.has(job._id || job.id) || applyingJobId === (job._id || job.id) || isJobExpired(job)}
                            onClick={() => handleApply(job._id || job.id)}
                            variant={appliedJobs.has(job._id || job.id) || isJobExpired(job) ? "secondary" : "default"}
                          >
                            {applyingJobId === (job._id || job.id)
                              ? 'Submitting...'
                              : appliedJobs.has(job._id || job.id)
                                ? 'Already Applied'
                                : isJobExpired(job)
                                  ? 'Application Closed'
                                  : 'Apply for this Position'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredJobs.length === 0 && (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-gray-500">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-semibold">No active job postings</p>
                        <p className="text-sm mt-2">Check back later for new opportunities</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            {/* Profile Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                  <button
                    onClick={() => setProfileTab('personal')}
                    className={`${profileTab === 'personal'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Personal Information
                  </button>
                  <button
                    onClick={() => setProfileTab('academic')}
                    className={`${profileTab === 'academic'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Academic Details
                  </button>
                  <button
                    onClick={() => setProfileTab('skills')}
                    className={`${profileTab === 'skills'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Skills
                  </button>
                  <button
                    onClick={() => setProfileTab('projects')}
                    className={`${profileTab === 'projects'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Projects
                  </button>
                  <button
                    onClick={() => setProfileTab('internships')}
                    className={`${profileTab === 'internships'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Internships
                  </button>
                  <button
                    onClick={() => setProfileTab('extracurricular')}
                    className={`${profileTab === 'extracurricular'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Extracurricular
                  </button>
                  <button
                    onClick={() => setProfileTab('resume')}
                    className={`${profileTab === 'resume'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Resume
                  </button>
                </nav>
              </div>
            </div>

            {/* Personal Information Tab */}
            {profileTab === 'personal' && (
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your basic and passport details</CardDescription>
                  {isPersonalLocked && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>⚠️ Note:</strong> Personal information cannot be changed once saved. Only moderators can update these fields.
                      </p>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={handleSaveProfile}>
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Basic Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={profileData.fullName}
                            readOnly
                            className="bg-gray-100 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">College Email</Label>
                          <Input
                            id="email"
                            value={profileData.email}
                            readOnly
                            className="bg-gray-100 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label htmlFor="primaryEmail">Primary Email *</Label>
                          <Input
                            id="primaryEmail"
                            type="email"
                            value={profileData.primaryEmail}
                            onChange={(e) => setProfileData({ ...profileData, primaryEmail: e.target.value })}
                            placeholder="primary@example.com"
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="secondaryEmail">Secondary Email</Label>
                          <Input
                            id="secondaryEmail"
                            type="email"
                            value={profileData.secondaryEmail}
                            onChange={(e) => setProfileData({ ...profileData, secondaryEmail: e.target.value })}
                            placeholder="secondary@example.com"
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="primaryPhone">Primary Phone Number *</Label>
                          <Input
                            id="primaryPhone"
                            type="tel"
                            value={profileData.primaryPhone}
                            onChange={(e) => setProfileData({ ...profileData, primaryPhone: e.target.value })}
                            placeholder="+91 1234567890"
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="secondaryPhone">Secondary Phone Number</Label>
                          <Input
                            id="secondaryPhone"
                            type="tel"
                            value={profileData.secondaryPhone}
                            onChange={(e) => setProfileData({ ...profileData, secondaryPhone: e.target.value })}
                            placeholder="+91 0987654321"
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={profileData.dateOfBirth}
                            onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="gender">Gender *</Label>
                          <select
                            id="gender"
                            value={profileData.gender}
                            onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            disabled={isPersonalLocked}
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="nationality">Nationality *</Label>
                          <Input
                            id="nationality"
                            value={profileData.nationality}
                            onChange={(e) => setProfileData({ ...profileData, nationality: e.target.value })}
                            placeholder="e.g., Indian"
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="address">Current Address *</Label>
                          <Textarea
                            id="address"
                            value={profileData.address}
                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                            placeholder="Enter your complete address"
                            rows={3}
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Passport Details */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Passport Details (Optional)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="passportNumber">Passport Number</Label>
                          <Input
                            id="passportNumber"
                            value={profileData.passportNumber}
                            onChange={(e) => setProfileData({ ...profileData, passportNumber: e.target.value })}
                            placeholder="e.g., A1234567"
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="passportPlaceOfIssue">Place of Issue</Label>
                          <Input
                            id="passportPlaceOfIssue"
                            value={profileData.passportPlaceOfIssue}
                            onChange={(e) => setProfileData({ ...profileData, passportPlaceOfIssue: e.target.value })}
                            placeholder="e.g., Bangalore"
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="passportIssueDate">Issue Date</Label>
                          <Input
                            id="passportIssueDate"
                            type="date"
                            value={profileData.passportIssueDate}
                            onChange={(e) => setProfileData({ ...profileData, passportIssueDate: e.target.value })}
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="passportExpiryDate">Expiry Date</Label>
                          <Input
                            id="passportExpiryDate"
                            type="date"
                            value={profileData.passportExpiryDate}
                            onChange={(e) => setProfileData({ ...profileData, passportExpiryDate: e.target.value })}
                            disabled={isPersonalLocked}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Personal Information
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Academic Details Tab */}
            {profileTab === 'academic' && (
              <Card>
                <CardHeader>
                  <CardTitle>Academic Details</CardTitle>
                  <CardDescription>Update your educational qualifications</CardDescription>
                  {isAcademicLocked && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>⚠️ Note:</strong> Academic information cannot be changed once saved. Only moderators can update these fields.
                      </p>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={handleSaveProfile}>
                    {/* 10th Standard */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">10th Standard</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="tenthInstitution">Institution Name *</Label>
                          <Input
                            id="tenthInstitution"
                            value={profileData.tenthInstitution}
                            onChange={(e) => setProfileData({ ...profileData, tenthInstitution: e.target.value })}
                            placeholder="e.g., ABC High School"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="tenthPercentage">Percentage / CGPA *</Label>
                          <Input
                            id="tenthPercentage"
                            type="number"
                            step="0.01"
                            value={profileData.tenthPercentage}
                            onChange={(e) => setProfileData({ ...profileData, tenthPercentage: e.target.value })}
                            placeholder="e.g., 85.5"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="tenthBoard">Board *</Label>
                          <Input
                            id="tenthBoard"
                            value={profileData.tenthBoard}
                            onChange={(e) => setProfileData({ ...profileData, tenthBoard: e.target.value })}
                            placeholder="e.g., CBSE, ICSE"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="tenthYear">Year of Passing *</Label>
                          <Input
                            id="tenthYear"
                            type="number"
                            value={profileData.tenthYear}
                            onChange={(e) => setProfileData({ ...profileData, tenthYear: e.target.value })}
                            placeholder="e.g., 2018"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* 12th Standard */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">12th Standard / Diploma</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="twelfthInstitution">Institution Name *</Label>
                          <Input
                            id="twelfthInstitution"
                            value={profileData.twelfthInstitution}
                            onChange={(e) => setProfileData({ ...profileData, twelfthInstitution: e.target.value })}
                            placeholder="e.g., XYZ Junior College"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="twelfthPercentage">Percentage / CGPA *</Label>
                          <Input
                            id="twelfthPercentage"
                            type="number"
                            step="0.01"
                            value={profileData.twelfthPercentage}
                            onChange={(e) => setProfileData({ ...profileData, twelfthPercentage: e.target.value })}
                            placeholder="e.g., 88.2"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="twelfthBoard">Board *</Label>
                          <Input
                            id="twelfthBoard"
                            value={profileData.twelfthBoard}
                            onChange={(e) => setProfileData({ ...profileData, twelfthBoard: e.target.value })}
                            placeholder="e.g., State Board, CBSE"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="twelfthYear">Year of Passing *</Label>
                          <Input
                            id="twelfthYear"
                            type="number"
                            value={profileData.twelfthYear}
                            onChange={(e) => setProfileData({ ...profileData, twelfthYear: e.target.value })}
                            placeholder="e.g., 2020"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Current Education */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Current Education</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="currentInstitution">College Name *</Label>
                          <Input
                            id="currentInstitution"
                            value={profileData.currentInstitution}
                            onChange={(e) => setProfileData({ ...profileData, currentInstitution: e.target.value })}
                            placeholder="e.g., University Institute of Technology"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="degree">Degree *</Label>
                          <Input
                            id="degree"
                            value={profileData.degree}
                            onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                            placeholder="e.g., B.Tech, B.E"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="branch">Branch / Specialization *</Label>
                          <Input
                            id="branch"
                            value={profileData.branch}
                            onChange={(e) => setProfileData({ ...profileData, branch: e.target.value })}
                            placeholder="e.g., Computer Science"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="semester">Current Semester *</Label>
                          <Input
                            id="semester"
                            type="number"
                            min="1"
                            max="8"
                            value={profileData.semester}
                            onChange={(e) => setProfileData({ ...profileData, semester: e.target.value })}
                            placeholder="e.g., 6"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cgpa">Overall CGPA *</Label>
                          <Input
                            id="cgpa"
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={profileData.cgpa}
                            onChange={(e) => setProfileData({ ...profileData, cgpa: e.target.value })}
                            placeholder="e.g., 8.5"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="backlogs">Active Backlogs</Label>
                          <Input
                            id="backlogs"
                            type="number"
                            min="0"
                            value={profileData.backlogs}
                            onChange={(e) => setProfileData({ ...profileData, backlogs: e.target.value })}
                            placeholder="e.g., 0"
                            disabled={isAcademicLocked}
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Semester-wise GPA */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Semester-wise GPA</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {semesterWiseGPA.map((semData, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-gray-50">
                            <h4 className="font-medium text-sm mb-2">Semester {semData.semester}</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor={`sgpa-${index}`} className="text-xs">SGPA</Label>
                                <Input
                                  id={`sgpa-${index}`}
                                  type="number"
                                  step="0.01"
                                  value={semData.sgpa}
                                  onChange={(e) => handleSemesterGPAChange(index, 'sgpa', e.target.value)}
                                  placeholder="SGPA"
                                  className={`h-8 text-sm ${isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  disabled={isAcademicLocked}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`cgpa-${index}`} className="text-xs">CGPA</Label>
                                <Input
                                  id={`cgpa-${index}`}
                                  type="number"
                                  step="0.01"
                                  value={semData.cgpa}
                                  onChange={(e) => handleSemesterGPAChange(index, 'cgpa', e.target.value)}
                                  placeholder="CGPA"
                                  className={`h-8 text-sm ${isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  disabled={isAcademicLocked}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Arrear Details */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Arrear Details</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="currentArrears">Current Arrears (Number) *</Label>
                          <Input
                            id="currentArrears"
                            type="number"
                            min="0"
                            value={currentArrears}
                            onChange={(e) => setCurrentArrears(e.target.value)}
                            placeholder="e.g., 2"
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            disabled={isAcademicLocked}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter the number of current pending arrears</p>
                        </div>

                        <div>
                          <Label htmlFor="arrearHistory">History of Arrears *</Label>
                          <Textarea
                            id="arrearHistory"
                            value={arrearHistory}
                            onChange={(e) => setArrearHistory(e.target.value)}
                            placeholder="e.g., Semester 3: Data Structures (Cleared in Sem 4), Semester 5: DBMS (Pending)"
                            className={isAcademicLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            disabled={isAcademicLocked}
                            rows={4}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Describe all arrears - both cleared and pending. Enter "None" if no arrear history.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Academic Details
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Skills Tab */}
            {profileTab === 'skills' && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Expertise</CardTitle>
                  <CardDescription>Add your technical and soft skills with categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Add Skill */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="text-sm font-semibold mb-3">Add New Skill</h4>
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Enter skill name (e.g., Java, Leadership)"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          className="flex-1"
                        />
                        <select
                          value={skillCategory}
                          onChange={(e) => setSkillCategory(e.target.value)}
                          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                        >
                          <option value="technical">Technical</option>
                          <option value="soft">Soft Skills</option>
                          <option value="tools">Tools & Platforms</option>
                          <option value="languages">Languages</option>
                        </select>
                        <Button onClick={addSkill} type="button">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>

                    {/* Skills List by Category */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Your Skills</h3>
                      {skills.length === 0 ? (
                        <p className="text-sm text-gray-500">No skills added yet. Add your skills above.</p>
                      ) : (
                        <div className="space-y-4">
                          {/* Technical Skills */}
                          {skills.filter(s => s.category === 'technical').length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-600 mb-2">💻 Technical Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {skills.filter(s => s.category === 'technical').map((skill) => (
                                  <div
                                    key={skill.id}
                                    className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                                  >
                                    <span>{skill.name}</span>
                                    <button
                                      onClick={() => removeSkill(skill.id)}
                                      className="hover:text-blue-900"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Soft Skills */}
                          {skills.filter(s => s.category === 'soft').length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-600 mb-2">🤝 Soft Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {skills.filter(s => s.category === 'soft').map((skill) => (
                                  <div
                                    key={skill.id}
                                    className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                                  >
                                    <span>{skill.name}</span>
                                    <button
                                      onClick={() => removeSkill(skill.id)}
                                      className="hover:text-green-900"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Skills
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Extracurricular Tab */}
            {profileTab === 'extracurricular' && (
              <Card>
                <CardHeader>
                  <CardTitle>Extracurricular Activities</CardTitle>
                  <CardDescription>Add your clubs, events, and other activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Add Activity Form */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="text-sm font-semibold mb-3">Add New Activity</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Activity Title *</Label>
                          <Input
                            value={newActivity.title}
                            onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                            placeholder="e.g., Coding Club"
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Input
                            value={newActivity.role}
                            onChange={(e) => setNewActivity({ ...newActivity, role: e.target.value })}
                            placeholder="e.g., President"
                          />
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <Input
                            value={newActivity.duration}
                            onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                            placeholder="e.g., 2022-2023"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={newActivity.description}
                            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                            placeholder="Brief description"
                          />
                        </div>
                      </div>
                      <Button onClick={addActivity} type="button">
                        <Plus className="h-4 w-4 mr-1" /> Add Activity
                      </Button>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-3">Your Activities</h3>
                      {extracurricular.length === 0 ? (
                        <p className="text-sm text-gray-500">No activities added yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {extracurricular.map((activity) => (
                            <Card key={activity.id} className="border-l-4 border-l-green-500">
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg">{activity.title}</h4>
                                    {activity.role && <p className="text-sm text-gray-600">{activity.role}</p>}
                                    {activity.duration && <p className="text-sm text-gray-500">{activity.duration}</p>}
                                    {activity.description && (
                                      <p className="text-sm mt-2 text-gray-700">{activity.description}</p>
                                    )}
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeActivity(activity.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Activities
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Projects Tab */}
            {
              profileTab === 'projects' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Projects</CardTitle>
                    <CardDescription>Add your academic and personal projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Add Project Form */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="text-sm font-semibold mb-3">Add New Project</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label>Project Title *</Label>
                            <Input
                              value={newProject.title}
                              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                              placeholder="e.g., E-commerce Website"
                            />
                          </div>
                          <div>
                            <Label>Tech Stack</Label>
                            <Input
                              value={newProject.techStack}
                              onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
                              placeholder="e.g., React, Node.js, MongoDB"
                            />
                          </div>
                          <div>
                            <Label>Date / Duration</Label>
                            <Input
                              value={newProject.date}
                              onChange={(e) => setNewProject({ ...newProject, date: e.target.value })}
                              placeholder="e.g., Jan 2024 - Mar 2024"
                            />
                          </div>
                          <div>
                            <Label>Project Link</Label>
                            <Input
                              value={newProject.link}
                              onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                              placeholder="e.g., GitHub or Live URL"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Description *</Label>
                            <Textarea
                              value={newProject.description}
                              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                              placeholder="Describe the project features and your role"
                              rows={3}
                            />
                          </div>
                        </div>
                        <Button onClick={addProject} type="button">
                          <Plus className="h-4 w-4 mr-1" /> Add Project
                        </Button>
                      </div>

                      {/* Projects List */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Your Projects</h3>
                        {projects.length === 0 ? (
                          <p className="text-sm text-gray-500">No projects added yet.</p>
                        ) : (
                          <div className="space-y-4">
                            {projects.map((project) => (
                              <Card key={project.id} className="border-l-4 border-l-blue-500">
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg">{project.title}</h4>
                                      <p className="text-sm text-gray-600">{project.techStack}</p>
                                      <p className="text-sm text-gray-500">{project.date}</p>
                                      {project.link && (
                                        <a href={project.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                                          View Project
                                        </a>
                                      )}
                                      {project.description && (
                                        <p className="text-sm mt-2 text-gray-700">{project.description}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removeProject(project.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end mt-6">
                        <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Save Projects
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            {/* Internships Tab */}
            {
              profileTab === 'internships' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Internships & Experience</CardTitle>
                    <CardDescription>Add your internship and work experience details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Add Internship Form */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="text-sm font-semibold mb-3">Add New Internship</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label>Company Name *</Label>
                            <Input
                              value={newInternship.company}
                              onChange={(e) => setNewInternship({ ...newInternship, company: e.target.value })}
                              placeholder="e.g., Google, Microsoft"
                            />
                          </div>
                          <div>
                            <Label>Role / Position *</Label>
                            <Input
                              value={newInternship.role}
                              onChange={(e) => setNewInternship({ ...newInternship, role: e.target.value })}
                              placeholder="e.g., Software Engineering Intern"
                            />
                          </div>
                          <div>
                            <Label>Duration</Label>
                            <Input
                              value={newInternship.duration}
                              onChange={(e) => setNewInternship({ ...newInternship, duration: e.target.value })}
                              placeholder="e.g., May 2024 - July 2024"
                            />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={newInternship.location}
                              onChange={(e) => setNewInternship({ ...newInternship, location: e.target.value })}
                              placeholder="e.g., Bangalore, Remote"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                              value={newInternship.description}
                              onChange={(e) => setNewInternship({ ...newInternship, description: e.target.value })}
                              placeholder="Describe your responsibilities and achievements"
                              rows={3}
                            />
                          </div>
                        </div>
                        <Button onClick={addInternship} type="button">
                          <Plus className="h-4 w-4 mr-1" /> Add Internship
                        </Button>
                      </div>

                      {/* Internships List */}
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Your Internships</h3>
                        {internships.length === 0 ? (
                          <p className="text-sm text-gray-500">No internships added yet.</p>
                        ) : (
                          <div className="space-y-4">
                            {internships.map((intern) => (
                              <Card key={intern.id} className="border-l-4 border-l-purple-500">
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg">{intern.company}</h4>
                                      <p className="text-sm font-medium text-gray-800">{intern.role}</p>
                                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                        {intern.duration && <span>{intern.duration}</span>}
                                        {intern.location && <span>📍 {intern.location}</span>}
                                      </div>
                                      {intern.description && (
                                        <p className="text-sm mt-2 text-gray-700">{intern.description}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removeInternship(intern.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end mt-6">
                        <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Save Internships
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            {/* Resume Tab */}
            {
              profileTab === 'resume' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resume Management</CardTitle>
                    <CardDescription>Upload your resume or generate one automatically</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Upload Resume */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Upload Resume (PDF)</h3>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-sm text-gray-600 mb-2">
                            Upload your resume in PDF format (Max 5MB)
                          </p>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="resume-upload"
                          />
                          <label htmlFor="resume-upload">
                            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => document.getElementById('resume-upload').click()}>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose File
                            </Button>
                          </label>
                          {resumeFile && (
                            <div className="flex items-center justify-center gap-2 mt-2">
                              <p className="text-sm text-green-600">
                                ✓ {resumeFile.name} selected
                              </p>
                              {resumeFile.url && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-blue-600 hover:text-blue-800"
                                  onClick={() => {
                                    setPdfUrl(resumeFile.url);
                                    setShowPdfModal(true);
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Or Resume Link */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Or Provide Resume Link</h3>
                        <div>
                          <Label htmlFor="resumeLink">Resume URL</Label>
                          <Input
                            id="resumeLink"
                            type="url"
                            value={profileData.resumeLink}
                            onChange={(e) => setProfileData({ ...profileData, resumeLink: e.target.value })}
                            placeholder="https://drive.google.com/..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Upload to Google Drive, Dropbox, or any cloud storage and paste the public link
                          </p>
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Save Resume Link
                          </Button>
                        </div>
                      </div>

                      {/* Resume Builder */}
                      <div className="border rounded-lg p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <div className="flex items-start gap-4">
                          <FileText className="h-12 w-12 text-indigo-600" />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Generate Resume Automatically</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Create a professional resume based on your profile data. Our AI will format your information into an ATS-friendly resume template.
                            </p>
                            <div className="flex gap-3">
                              <Button onClick={() => setActiveTab('resume-builder')} className="bg-indigo-600 hover:bg-indigo-700">
                                Go to Resume Builder
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }
          </div >
        )}

        {/* Resume Builder Tab */}
        {
          activeTab === 'resume-builder' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Resume Builder</h2>
                  <p className="text-gray-600">Preview and download your professional resume</p>
                </div>
                <Button onClick={handlePrint} className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar / Tips */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resume Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-gray-600">
                      <p>• Keep your resume concise (1 page is ideal).</p>
                      <p>• Use bullet points for readability.</p>
                      <p>• Highlight achievements over responsibilities.</p>
                      <p>• Ensure your contact details are up to date.</p>
                      <p>• Add projects to showcase your practical skills.</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Missing Information?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        If your resume looks empty, go back to your profile and add more details.
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab('profile')} className="w-full">
                        Edit Profile
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Resume Preview */}
                <div className="lg:col-span-2">
                  <div className="border rounded-lg shadow-lg overflow-hidden bg-gray-50 p-4 overflow-x-auto">
                    <ResumeTemplate
                      ref={resumeRef}
                      data={{
                        personal: {
                          name: user?.fullName,
                          email: profileData.primaryEmail,
                          phone: profileData.primaryPhone,
                          linkedin: profileData.linkedin,
                          github: profileData.github,
                          portfolio: profileData.portfolio,
                          address: profileData.address
                        },
                        education: [
                          {
                            institution: profileData.currentInstitution || user?.collegeName,
                            degree: profileData.degree,
                            branch: profileData.branch,
                            year: profileData.semester ? `Semester ${profileData.semester}` : '',
                            cgpa: profileData.cgpa,
                            location: profileData.address
                          },
                          {
                            institution: profileData.twelfthInstitution || profileData.twelfthBoard,
                            degree: 'Class XII',
                            year: profileData.twelfthYear,
                            cgpa: profileData.twelfthPercentage ? `${profileData.twelfthPercentage}%` : ''
                          }
                        ].filter(e => e.institution),
                        skills: skills,
                        experience: internships,
                        projects: projects,
                        achievements: extracurricular
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div >

      {/* PDF Viewer Modal */}
      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 h-5/6 flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Resume Preview</h2>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${pdfUrl}?dl=false`}
                className="w-full h-full border-none"
                title="Resume Preview"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
              <a
                href={`${pdfUrl}?dl=false`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Open in new tab
              </a>
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
