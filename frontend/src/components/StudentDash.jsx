import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, applicationAPI, userAPI } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Briefcase, LogOut, MapPin, Calendar, User, Save, Upload, Plus, Trash2, FileText, Download, Menu, X } from 'lucide-react';

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

  const [arrearHistory, setArrearHistory] = useState([]);
  const [newArrear, setNewArrear] = useState({
    subjectName: '',
    subjectCode: '',
    semester: '',
    status: 'pending', // pending, cleared
    clearedInSemester: '',
  });

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
  });

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userId = user?.id;
      if (!userId) {
        console.log('No user ID found');
        return;
      }

      console.log('Fetching profile for user:', userId);
      const response = await userAPI.getById(userId);
      
      const currentUser = response.data.data || response.data;
      
      if (currentUser) {
        console.log('Profile data loaded:', currentUser);
        
        // Populate profile data
        setProfileData({
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          primaryEmail: currentUser.primaryEmail || '',
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
        
        // Populate arrear history
        if (currentUser.arrearHistory && Array.isArray(currentUser.arrearHistory) && currentUser.arrearHistory.length > 0) {
          setArrearHistory(currentUser.arrearHistory.map((arr, idx) => ({
            ...arr,
            id: arr._id || idx
          })));
        }
        
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't show alert for profile fetch errors, just log it
    }
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
        
        // Arrear history
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
        
        // Resume
        resumeLink: profileData.resumeLink,
      };

      console.log('Saving profile data:', profileUpdateData);
      
      // Call API to update user profile
      await userAPI.update(userId, profileUpdateData);
      
      // TODO: Handle file upload separately if resumeFile exists
      if (resumeFile) {
        console.log('Resume file to upload:', resumeFile.name);
        // File upload will need multipart/form-data
        // Can be implemented later with a separate endpoint
      }
      
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(error.response?.data?.message || 'Error saving profile. Please try again.');
    }
  };

  const handleFileUpload = (e) => {
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
      setResumeFile(file);
      alert('Resume file selected: ' + file.name);
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

  const addArrear = () => {
    if (newArrear.subjectName && newArrear.semester) {
      setArrearHistory([...arrearHistory, { ...newArrear, id: Date.now() }]);
      setNewArrear({
        subjectName: '',
        subjectCode: '',
        semester: '',
        status: 'pending',
        clearedInSemester: '',
      });
    } else {
      alert('Please fill subject name and semester');
    }
  };

  const removeArrear = (id) => {
    setArrearHistory(arrearHistory.filter(item => item.id !== id));
  };

  const updateArrearStatus = (id, status, clearedSem) => {
    const updated = arrearHistory.map(arrear => 
      arrear.id === id 
        ? { ...arrear, status, clearedInSemester: clearedSem } 
        : arrear
    );
    setArrearHistory(updated);
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
      console.log('Applying to job:', jobId);
      const response = await applicationAPI.create({ jobId });
      console.log('Application response:', response);
      alert('Application submitted successfully!');
      setAppliedJobs(prev => new Set([...prev, jobId]));
    } catch (error) {
      console.error('Error applying to job:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Error submitting application';
      alert(errorMsg);
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
                  Welcome, {user?.fullName} • {user?.department}
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
                  className={`${
                    activeTab === 'jobs'
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
                  className={`${
                    activeTab === 'profile'
                      ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  } px-4 py-3 text-left font-medium text-sm flex items-center gap-3 rounded-r`}
                >
                  <User className="h-5 w-5" />
                  My Profile
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
              className={`${
                activeTab === 'jobs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Briefcase className="h-4 w-4" />
              Available Jobs
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <User className="h-4 w-4" />
              My Profile
            </button>
          </nav>
        </div>

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
                    className={`${
                      profileTab === 'personal'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Personal Information
                  </button>
                  <button
                    onClick={() => setProfileTab('academic')}
                    className={`${
                      profileTab === 'academic'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Academic Details
                  </button>
                  <button
                    onClick={() => setProfileTab('skills')}
                    className={`${
                      profileTab === 'skills'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Skills
                  </button>
                  <button
                    onClick={() => setProfileTab('internships')}
                    className={`${
                      profileTab === 'internships'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Internships
                  </button>
                  <button
                    onClick={() => setProfileTab('extracurricular')}
                    className={`${
                      profileTab === 'extracurricular'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    Extracurricular
                  </button>
                  <button
                    onClick={() => setProfileTab('resume')}
                    className={`${
                      profileTab === 'resume'
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
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Basic Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="primaryEmail">Primary Email *</Label>
                          <Input
                            id="primaryEmail"
                            type="email"
                            value={profileData.primaryEmail}
                            onChange={(e) => setProfileData({ ...profileData, primaryEmail: e.target.value })}
                            placeholder="primary@example.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="secondaryEmail">Secondary Email (Optional)</Label>
                          <Input
                            id="secondaryEmail"
                            type="email"
                            value={profileData.secondaryEmail}
                            onChange={(e) => setProfileData({ ...profileData, secondaryEmail: e.target.value })}
                            placeholder="secondary@example.com"
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
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="secondaryPhone">Secondary Phone Number (Optional)</Label>
                          <Input
                            id="secondaryPhone"
                            type="tel"
                            value={profileData.secondaryPhone}
                            onChange={(e) => setProfileData({ ...profileData, secondaryPhone: e.target.value })}
                            placeholder="+91 0987654321"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dob">Date of Birth *</Label>
                          <Input
                            id="dob"
                            type="date"
                            value={profileData.dateOfBirth}
                            onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="gender">Gender *</Label>
                          <select
                            id="gender"
                            value={profileData.gender}
                            onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="nationality">Nationality *</Label>
                          <Input
                            id="nationality"
                            value={profileData.nationality}
                            onChange={(e) => setProfileData({ ...profileData, nationality: e.target.value })}
                            placeholder="e.g., Indian"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="address">Address *</Label>
                          <Textarea
                            id="address"
                            value={profileData.address}
                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                            placeholder="Enter your complete address"
                            rows={3}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Passport Details (Optional) */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">Passport Details</h3>
                      <p className="text-sm text-gray-500 mb-4">(Optional - Required for international placements)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="passportNumber">Passport Number</Label>
                          <Input
                            id="passportNumber"
                            value={profileData.passportNumber}
                            onChange={(e) => setProfileData({ ...profileData, passportNumber: e.target.value })}
                            placeholder="e.g., A1234567"
                          />
                        </div>
                        <div>
                          <Label htmlFor="passportPlaceOfIssue">Place of Issue</Label>
                          <Input
                            id="passportPlaceOfIssue"
                            value={profileData.passportPlaceOfIssue}
                            onChange={(e) => setProfileData({ ...profileData, passportPlaceOfIssue: e.target.value })}
                            placeholder="e.g., Bangalore"
                          />
                        </div>
                        <div>
                          <Label htmlFor="passportIssueDate">Issue Date</Label>
                          <Input
                            id="passportIssueDate"
                            type="date"
                            value={profileData.passportIssueDate}
                            onChange={(e) => setProfileData({ ...profileData, passportIssueDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="passportExpiryDate">Expiry Date</Label>
                          <Input
                            id="passportExpiryDate"
                            type="date"
                            value={profileData.passportExpiryDate}
                            onChange={(e) => setProfileData({ ...profileData, passportExpiryDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} className="flex items-center gap-2">
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
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
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
                            placeholder="e.g., 90.0"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="twelfthBoard">Board *</Label>
                          <Input
                            id="twelfthBoard"
                            value={profileData.twelfthBoard}
                            onChange={(e) => setProfileData({ ...profileData, twelfthBoard: e.target.value })}
                            placeholder="e.g., CBSE, State Board"
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
                          <Label htmlFor="currentInstitution">Institution / University Name *</Label>
                          <Input
                            id="currentInstitution"
                            value={profileData.currentInstitution}
                            onChange={(e) => setProfileData({ ...profileData, currentInstitution: e.target.value })}
                            placeholder="e.g., VTU, Anna University"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="degree">Degree *</Label>
                          <Input
                            id="degree"
                            value={profileData.degree}
                            onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                            placeholder="e.g., B.Tech, B.E."
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
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="semester">Current Semester *</Label>
                          <Input
                            id="semester"
                            type="number"
                            value={profileData.semester}
                            onChange={(e) => setProfileData({ ...profileData, semester: e.target.value })}
                            placeholder="e.g., 6"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cgpa">Overall CGPA (Auto-calculated) *</Label>
                          <Input
                            id="cgpa"
                            type="number"
                            step="0.01"
                            value={profileData.cgpa}
                            readOnly
                            className="bg-gray-100"
                            placeholder="Will be calculated from semester-wise data"
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter semester-wise CGPA below to auto-calculate</p>
                        </div>
                        <div>
                          <Label htmlFor="backlogs">Current Active Backlogs *</Label>
                          <Input
                            id="backlogs"
                            type="number"
                            value={profileData.backlogs}
                            onChange={(e) => setProfileData({ ...profileData, backlogs: e.target.value })}
                            placeholder="0"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Semester-wise CGPA */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Semester-wise Performance</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left">Semester</th>
                              <th className="border p-2 text-left">SGPA</th>
                              <th className="border p-2 text-left">CGPA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semesterWiseGPA.map((sem, index) => (
                              <tr key={sem.semester}>
                                <td className="border p-2">Semester {sem.semester}</td>
                                <td className="border p-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    value={sem.sgpa}
                                    onChange={(e) => updateSemesterGPA(index, 'sgpa', e.target.value)}
                                    placeholder="SGPA"
                                    className="w-24"
                                  />
                                </td>
                                <td className="border p-2">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    value={sem.cgpa}
                                    onChange={(e) => updateSemesterGPA(index, 'cgpa', e.target.value)}
                                    placeholder="CGPA"
                                    className="w-24"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-xs text-gray-500 mt-2">
                          Overall CGPA will be automatically calculated based on semester CGPA values
                        </p>
                      </div>
                    </div>

                    {/* Arrear History */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Arrear History</h3>
                      
                      {/* Add Arrear Form */}
                      <div className="border rounded-lg p-4 bg-gray-50 mb-4">
                        <h4 className="text-sm font-semibold mb-3">Add Arrear</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">Subject Name *</Label>
                            <Input
                              value={newArrear.subjectName}
                              onChange={(e) => setNewArrear({ ...newArrear, subjectName: e.target.value })}
                              placeholder="e.g., Data Structures"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Subject Code</Label>
                            <Input
                              value={newArrear.subjectCode}
                              onChange={(e) => setNewArrear({ ...newArrear, subjectCode: e.target.value })}
                              placeholder="e.g., CS301"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Failed in Semester *</Label>
                            <Input
                              type="number"
                              value={newArrear.semester}
                              onChange={(e) => setNewArrear({ ...newArrear, semester: e.target.value })}
                              placeholder="e.g., 3"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Status</Label>
                            <select
                              value={newArrear.status}
                              onChange={(e) => setNewArrear({ ...newArrear, status: e.target.value })}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="cleared">Cleared</option>
                            </select>
                          </div>
                          {newArrear.status === 'cleared' && (
                            <div>
                              <Label className="text-xs">Cleared in Semester</Label>
                              <Input
                                type="number"
                                value={newArrear.clearedInSemester}
                                onChange={(e) => setNewArrear({ ...newArrear, clearedInSemester: e.target.value })}
                                placeholder="e.g., 4"
                                className="text-sm"
                              />
                            </div>
                          )}
                        </div>
                        <Button onClick={addArrear} type="button" size="sm" className="mt-3">
                          <Plus className="h-3 w-3 mr-1" /> Add Arrear
                        </Button>
                      </div>

                      {/* Arrear List */}
                      {arrearHistory.length === 0 ? (
                        <p className="text-sm text-green-600">✓ No arrears recorded</p>
                      ) : (
                        <div className="space-y-2">
                          {arrearHistory.map((arrear) => (
                            <div key={arrear.id} className="border rounded p-3 flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-semibold text-sm">{arrear.subjectName} {arrear.subjectCode && `(${arrear.subjectCode})`}</h5>
                                <p className="text-xs text-gray-600">Failed in Semester {arrear.semester}</p>
                                <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                                  arrear.status === 'cleared' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {arrear.status === 'cleared' ? `✓ Cleared in Sem ${arrear.clearedInSemester}` : '⏳ Pending'}
                                </span>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeArrear(arrear.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} className="flex items-center gap-2">
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

                          {/* Tools & Platforms */}
                          {skills.filter(s => s.category === 'tools').length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-600 mb-2">🛠️ Tools & Platforms</h4>
                              <div className="flex flex-wrap gap-2">
                                {skills.filter(s => s.category === 'tools').map((skill) => (
                                  <div
                                    key={skill.id}
                                    className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm"
                                  >
                                    <span>{skill.name}</span>
                                    <button
                                      onClick={() => removeSkill(skill.id)}
                                      className="hover:text-purple-900"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Languages */}
                          {skills.filter(s => s.category === 'languages').length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-600 mb-2">🌍 Languages</h4>
                              <div className="flex flex-wrap gap-2">
                                {skills.filter(s => s.category === 'languages').map((skill) => (
                                  <div
                                    key={skill.id}
                                    className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm"
                                  >
                                    <span>{skill.name}</span>
                                    <button
                                      onClick={() => removeSkill(skill.id)}
                                      className="hover:text-orange-900"
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

                    {/* Professional Links */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Professional Links</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="github">GitHub Profile</Label>
                          <Input
                            id="github"
                            type="url"
                            value={profileData.github}
                            onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                            placeholder="https://github.com/username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedin">LinkedIn Profile</Label>
                          <Input
                            id="linkedin"
                            type="url"
                            value={profileData.linkedin}
                            onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="portfolio">Portfolio / Website</Label>
                          <Input
                            id="portfolio"
                            type="url"
                            value={profileData.portfolio}
                            onChange={(e) => setProfileData({ ...profileData, portfolio: e.target.value })}
                            placeholder="https://yourportfolio.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Skills
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Internships Tab */}
            {profileTab === 'internships' && (
              <Card>
                <CardHeader>
                  <CardTitle>Internship Experience</CardTitle>
                  <CardDescription>Add your internship and work experience</CardDescription>
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
                            placeholder="e.g., Software Developer Intern"
                          />
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <Input
                            value={newInternship.duration}
                            onChange={(e) => setNewInternship({ ...newInternship, duration: e.target.value })}
                            placeholder="e.g., May 2023 - July 2023"
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
                          {internships.map((internship) => (
                            <Card key={internship.id} className="border-l-4 border-l-indigo-500">
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg">{internship.role}</h4>
                                    <p className="text-sm text-gray-600">{internship.company}</p>
                                    <p className="text-sm text-gray-500">{internship.duration} • {internship.location}</p>
                                    {internship.description && (
                                      <p className="text-sm mt-2 text-gray-700">{internship.description}</p>
                                    )}
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeInternship(internship.id)}
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
                        Save Internships
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
                  <CardDescription>Add your achievements, competitions, clubs, and volunteer work</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Add Activity Form */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="text-sm font-semibold mb-3">Add New Activity</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="md:col-span-2">
                          <Label>Activity Title *</Label>
                          <Input
                            value={newActivity.title}
                            onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                            placeholder="e.g., Hackathon Winner, Sports Captain, NSS Volunteer"
                          />
                        </div>
                        <div>
                          <Label>Your Role</Label>
                          <Input
                            value={newActivity.role}
                            onChange={(e) => setNewActivity({ ...newActivity, role: e.target.value })}
                            placeholder="e.g., Team Lead, President, Member"
                          />
                        </div>
                        <div>
                          <Label>Duration / Year</Label>
                          <Input
                            value={newActivity.duration}
                            onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                            placeholder="e.g., 2023, 2022-2024"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            value={newActivity.description}
                            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                            placeholder="Describe the activity and your contributions"
                            rows={3}
                          />
                        </div>
                      </div>
                      <Button onClick={addActivity} type="button">
                        <Plus className="h-4 w-4 mr-1" /> Add Activity
                      </Button>
                    </div>

                    {/* Activities List */}
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

            {/* Resume Tab */}
            {profileTab === 'resume' && (
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
                          <p className="text-sm text-green-600 mt-2">
                            ✓ {resumeFile.name} selected
                          </p>
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
                            <Button onClick={generateResume} className="bg-indigo-600 hover:bg-indigo-700">
                              <FileText className="h-4 w-4 mr-2" />
                              Generate Resume
                            </Button>
                            <Button variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download Template
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Resume
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
