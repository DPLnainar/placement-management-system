import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, applicationAPI, userAPI, uploadAPI, eligibilityAPI, studentAPI } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Briefcase, LogOut, MapPin, Calendar, User, Save, Upload, Plus, Trash2, FileText, Download, Menu, X, Printer, ExternalLink, Clock, Award, CheckCircle, AlertCircle, XCircle, ShieldCheck, Lock } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import html2pdf from 'html2pdf.js';
import { ResumeTemplate } from './ResumeTemplate';
import ApplicationTracker from './ApplicationTracker';
import JobDetailModal from './student/JobDetailModal';

// Helper function to get inline viewable URL for PDFs
const getInlineViewUrl = (url) => {
  if (!url) return url;

  // For any cloudinary PDF, use backend proxy with correct headers
  if (url.includes('cloudinary.com')) {
    // Use backend proxy endpoint with absolute URL
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    return `${backendUrl}/api/upload/preview-pdf?url=${encodeURIComponent(url)}`;
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
  const fileInputRef = useRef(null); // Ref for file upload input
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [jobEligibility, setJobEligibility] = useState({}); // Track eligibility for each job
  const [activeTab, setActiveTab] = useState('jobs');
  const [profileTab, setProfileTab] = useState('personal');
  const [resumeFile, setResumeFile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPersonalLocked, setIsPersonalLocked] = useState(false);
  const [isAcademicLocked, setIsAcademicLocked] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [missingProfileFields, setMissingProfileFields] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    // NEW: Identity Fields
    rollNumber: '',
    firstName: '',
    lastName: '',
    fullName: '', // Auto-computed

    // Personal Information
    primaryEmail: '',
    secondaryEmail: '',
    primaryPhone: '',
    secondaryPhone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    fatherName: '',
    motherName: '',
    aadhaarNumber: '',
    permanentAddress: '',
    photoUrl: '',

    // NEW: Academic Fields
    course: '',
    courseOther: '',
    passedOutYear: '',
    careerPath: '',
    disabilityStatus: 'none',

    // NEW: Contact Information
    communicationEmail: '',
    instituteEmail: '',
    personalEmail: '',
    alternateEmail: '',
    whatsappNumber: '',
    linkedInUrl: '',

    // NEW: Extended Family Details
    fatherPhone: '',
    fatherOccupation: '',
    motherPhone: '',
    motherOccupation: '',

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

  // Offers state
  const [offers, setOffers] = useState([]);
  const [isPlaced, setIsPlaced] = useState(false);
  const [acceptedOfferId, setAcceptedOfferId] = useState(null);
  const [acceptingOfferId, setAcceptingOfferId] = useState(null);

  const resumeRef = React.useRef();
  const handlePrint = useReactToPrint({
    content: () => resumeRef.current,
    documentTitle: `${user?.username || 'Student'}_Resume`,
  });

  const handleDownloadPDF = async () => {
    try {
      const element = resumeRef.current;

      if (!element) {
        alert('Resume content not found');
        return;
      }

      const opt = {
        margin: 10,
        filename: `${user?.username || 'Student'}_Resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback to print dialog
      handlePrint();
    }
  };

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
    fetchOffers();
  }, []);

  const checkProfileCompletion = (studentData) => {
    // Use backend-calculated completion flags instead of manual checking
    // The backend automatically sets these flags when profile is saved
    const isComplete = studentData.isProfileCompleted || studentData.mandatoryFieldsCompleted || false;

    // Calculate missing fields for display purposes only
    const requiredFields = {
      name: studentData.personal?.name,
      email: studentData.personal?.email,
      phone: studentData.personal?.phone,
      dateOfBirth: studentData.personal?.dob,
      gender: studentData.personal?.gender,
      tenthPercentage: studentData.education?.tenth?.percentage,
      twelfthPercentage: studentData.education?.twelfth?.percentage,
      cgpa: studentData.education?.graduation?.cgpa,
    };

    const missing = [];
    Object.entries(requiredFields).forEach(([field, value]) => {
      if (!value || value === '' || value === null) {
        missing.push(field);
      }
    });

    setMissingProfileFields(missing);
    setIsProfileComplete(isComplete);

    console.log('Profile Completion Check:');
    console.log('- isProfileCompleted (backend):', studentData.isProfileCompleted);
    console.log('- mandatoryFieldsCompleted (backend):', studentData.mandatoryFieldsCompleted);
    console.log('- Missing fields:', missing);
    console.log('- Final isComplete:', isComplete);

    return isComplete;
  };

  const [verificationStatus, setVerificationStatus] = useState('PENDING');
  const [verificationRejectionReason, setVerificationRejectionReason] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');

  const fetchProfile = async () => {
    try {
      const response = await studentAPI.getProfile();
      const student = response.data.student;

      console.log('=== FETCH PROFILE DEBUG ===');
      console.log('Student data received:', student);
      console.log('DOB from backend:', student.personal?.dob);
      console.log('10th schoolName from backend:', student.education?.tenth?.schoolName);
      console.log('12th schoolName from backend:', student.education?.twelfth?.schoolName);
      console.log('10th Percentage:', student.education?.tenth?.percentage);
      console.log('Full Name:', student.personal?.fullName);

      if (student) {
        // Check locked status from backend
        setIsPersonalLocked(!!student.personalInfoLocked);
        setIsAcademicLocked(!!student.academicInfoLocked);
        setVerificationStatus(student.verificationStatus || 'PENDING');
        setVerificationRejectionReason(student.verificationRejectionReason || '');
        setVerificationNotes(student.verificationNotes || '');

        // Populate profile data from nested structure
        setProfileData({
          // NEW: Identity Fields
          rollNumber: student.personal?.rollNumber || '',
          firstName: student.personal?.firstName || '',
          lastName: student.personal?.lastName || '',
          fullName: student.personal?.fullName || student.personal?.name || user?.fullName || '',

          // Basic Information
          email: student.personal?.email || user?.email || '',
          primaryEmail: student.personal?.email || '',
          secondaryEmail: student.personal?.secondaryEmail || '',
          primaryPhone: student.personal?.phone || '',
          secondaryPhone: student.personal?.secondaryPhone || '',
          dateOfBirth: student.personal?.dob ? student.personal.dob.split('T')[0] : '',
          gender: student.personal?.gender || '',
          nationality: student.personal?.nationality || 'Indian',
          fatherName: student.personal?.fatherName || '',
          motherName: student.personal?.motherName || '',
          aadhaarNumber: student.personal?.aadhaar || '',
          permanentAddress: student.personal?.permanentAddress || '',
          address: student.personal?.address || '',
          photoUrl: student.personal?.photoUrl || '',

          // NEW: Academic Fields
          course: student.personal?.course || '',
          courseOther: student.personal?.courseOther || '',
          passedOutYear: student.personal?.passedOutYear || '',
          careerPath: student.personal?.careerPath || '',
          disabilityStatus: student.personal?.disabilityStatus || 'none',

          // NEW: Contact Information
          communicationEmail: student.personal?.communicationEmail || '',
          instituteEmail: student.personal?.instituteEmail || '',
          personalEmail: student.personal?.personalEmail || '',
          alternateEmail: student.personal?.alternateEmail || '',
          whatsappNumber: student.personal?.whatsappNumber || '',
          linkedInUrl: student.personal?.linkedInUrl || '',

          // NEW: Extended Family Details
          fatherPhone: student.personal?.fatherPhone || '',
          fatherOccupation: student.personal?.fatherOccupation || '',
          motherPhone: student.personal?.motherPhone || '',
          motherOccupation: student.personal?.motherOccupation || '',

          // Passport
          passportNumber: student.personal?.passportNo || '',
          passportPlaceOfIssue: '', // Not in new schema, maybe keep empty or map if added
          passportIssueDate: '',
          passportExpiryDate: '',

          // Academic - 10th
          tenthInstitution: student.education?.tenth?.schoolName || '',
          tenthPercentage: student.education?.tenth?.percentage || '',
          tenthBoard: student.education?.tenth?.board || '',
          tenthYear: student.education?.tenth?.yearOfPassing || '',

          // Academic - 12th
          twelfthInstitution: student.education?.twelfth?.schoolName || '',
          twelfthPercentage: student.education?.twelfth?.percentage || '',
          twelfthBoard: student.education?.twelfth?.board || '',
          twelfthYear: student.education?.twelfth?.yearOfPassing || '',

          // Academic - Graduation
          currentInstitution: student.education?.graduation?.institutionName || '',
          degree: student.education?.graduation?.degree || '',
          branch: student.education?.graduation?.branch || '',
          semester: student.education?.graduation?.currentSemester || '',
          cgpa: student.education?.graduation?.cgpa || '',
          backlogs: student.currentBacklogs || '',

          // Links
          github: student.socialLinks?.github || '',
          linkedin: student.socialLinks?.linkedin || '',
          portfolio: student.socialLinks?.portfolio || '',
          resumeLink: student.resume?.resumeUrl || '',
        });

        console.log('=== PROFILE DATA SET IN STATE ===');
        console.log('dateOfBirth set to:', student.personal?.dob ? student.personal.dob.split('T')[0] : '');
        console.log('tenthInstitution set to:', student.education?.tenth?.schoolName || '');
        console.log('twelfthInstitution set to:', student.education?.twelfth?.schoolName || '');

        // Populate complex arrays
        if (student.education?.graduation?.semesterResults) {
          setSemesterWiseGPA(student.education.graduation.semesterResults.map(sem => ({
            semester: sem.semester,
            sgpa: sem.sgpa,
            cgpa: sem.cgpa || '' // Calculate if missing
          })));
        }

        // Arrears
        setCurrentArrears(student.currentArrears || '');
        setArrearHistory(student.arrearHistory || '');

        // Skills
        if (student.skills) {
          const allSkills = [
            ...(student.skills.technical || []).map(s => ({ name: s.name, category: 'technical', level: s.level, id: Date.now() + Math.random() })),
            ...(student.skills.soft || []).map(s => ({ name: s, category: 'soft', id: Date.now() + Math.random() })),
            ...(student.skills.tools || []).map(s => ({ name: s, category: 'tools', id: Date.now() + Math.random() })),
            ...(student.skills.languages || []).map(s => ({ name: s, category: 'languages', id: Date.now() + Math.random() }))
          ];
          setSkills(allSkills);
        }

        // Internships (Experience)
        if (student.experience) {
          setInternships(student.experience.map((exp, idx) => ({
            company: exp.companyName,
            role: exp.role,
            duration: `${exp.startDate ? exp.startDate.split('T')[0] : ''} - ${exp.endDate ? exp.endDate.split('T')[0] : 'Present'}`,
            description: exp.description,
            location: exp.location,
            id: idx
          })));
        }

        // Projects
        if (student.projects) {
          setProjects(student.projects.map((proj, idx) => ({
            title: proj.title,
            techStack: proj.technologies?.join(', ') || '',
            date: '', // Not in schema
            link: proj.url,
            description: proj.description,
            id: idx
          })));
        }

        // Extracurricular (Achievements/Certifications)
        // Mapping achievements to extracurricular for now
        if (student.achievements) {
          setExtracurricular(student.achievements.map((ach, idx) => ({
            title: ach.title,
            role: '',
            duration: ach.date ? ach.date.split('T')[0] : '',
            description: ach.description,
            id: idx
          })));
        }

        checkProfileCompletion(student); // You might need to update checkProfileCompletion to handle nested object

        if (student.resume?.resumeUrl) {
          setResumeFile({
            name: 'Current Resume',
            url: student.resume.resumeUrl
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await studentAPI.getOffers();
      if (response.data.success) {
        setOffers(response.data.offers || []);
        setIsPlaced(response.data.placed || false);

        // Find accepted offer
        const accepted = response.data.offers?.find(o => o.status === 'accepted');
        if (accepted) {
          setAcceptedOfferId(accepted._id);
        }
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to accept this offer? This action cannot be undone and you will not be able to apply to other jobs.')) {
      return;
    }

    setAcceptingOfferId(offerId);
    try {
      const response = await studentAPI.acceptOffer(offerId);
      if (response.data.success) {
        alert('Offer accepted successfully! You are now marked as placed.');
        await fetchOffers();
        await fetchProfile();
        setIsPlaced(true);
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert(error.response?.data?.message || 'Failed to accept offer. Please try again.');
    } finally {
      setAcceptingOfferId(null);
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
      // Map flat state to nested backend schema
      const profileUpdateData = {
        personal: {
          // NEW: Identity Fields
          rollNumber: profileData.rollNumber,
          firstName: profileData.firstName,
          lastName: profileData.lastName,

          // Basic Information
          name: profileData.fullName,
          email: profileData.primaryEmail,
          phone: profileData.primaryPhone,
          dob: profileData.dateOfBirth,
          gender: profileData.gender,
          nationality: profileData.nationality,

          // NEW: Academic Fields
          course: profileData.course,
          courseOther: profileData.courseOther,
          branch: profileData.branch,
          passedOutYear: profileData.passedOutYear ? parseInt(profileData.passedOutYear) : undefined,
          careerPath: profileData.careerPath,
          disabilityStatus: profileData.disabilityStatus,

          // NEW: Contact Information
          communicationEmail: profileData.communicationEmail,
          instituteEmail: profileData.instituteEmail,
          personalEmail: profileData.personalEmail,
          alternateEmail: profileData.alternateEmail,
          whatsappNumber: profileData.whatsappNumber,
          linkedInUrl: profileData.linkedInUrl,

          // Family Details
          fatherName: profileData.fatherName,
          motherName: profileData.motherName,
          fatherPhone: profileData.fatherPhone,
          fatherOccupation: profileData.fatherOccupation,
          motherPhone: profileData.motherPhone,
          motherOccupation: profileData.motherOccupation,

          // Secure & Address
          aadhaar: profileData.aadhaarNumber,
          permanentAddress: profileData.permanentAddress,
          address: profileData.address,
          passportNo: profileData.passportNumber,
        },
        education: {
          tenth: {
            schoolName: profileData.tenthInstitution,
            board: profileData.tenthBoard,
            percentage: parseFloat(profileData.tenthPercentage),
            yearOfPassing: parseInt(profileData.tenthYear),
          },
          twelfth: {
            schoolName: profileData.twelfthInstitution,
            board: profileData.twelfthBoard,
            percentage: parseFloat(profileData.twelfthPercentage),
            yearOfPassing: parseInt(profileData.twelfthYear),
          },
          graduation: {
            institutionName: profileData.currentInstitution,
            degree: profileData.degree,
            branch: profileData.branch,
            cgpa: parseFloat(profileData.cgpa),
            currentSemester: parseInt(profileData.semester),
            semesterResults: semesterWiseGPA.map(sem => ({
              semester: sem.semester,
              sgpa: parseFloat(sem.sgpa) || 0,
              cgpa: parseFloat(sem.cgpa) || 0
            }))
          }
        },
        currentBacklogs: parseInt(profileData.backlogs) || 0,
        currentArrears: currentArrears,
        arrearHistory: arrearHistory,

        // Flatten skills to match backend schema
        skills: skills.map(s => s.name),

        technicalSkills: {
          programming: skills.filter(s => s.category === 'technical').map(s => ({
            name: s.name,
            proficiency: 'intermediate'
          })),
          tools: skills.filter(s => s.category === 'tools').map(s => ({
            name: s.name,
            proficiency: 'intermediate'
          })),
          frameworks: [],
          databases: [],
          cloud: [],
          other: []
        },

        languages: skills.filter(s => s.category === 'languages').map(s => ({
          name: s.name,
          proficiency: 'conversational'
        })),

        softSkills: skills.filter(s => s.category === 'soft').map(s => ({
          name: s.name
        })),

        experience: internships.map(i => ({
          companyName: i.company,
          role: i.role,
          description: i.description,
          location: i.location,
        })),

        projects: projects.map(p => ({
          title: p.title,
          description: p.description,
          technologies: p.techStack ? p.techStack.split(',').map(t => t.trim()) : [],
          url: p.link
        })),

        socialLinks: {
          github: profileData.github,
          linkedin: profileData.linkedin,
          portfolio: profileData.portfolio
        }
      };

      const response = await studentAPI.updateProfile(profileUpdateData);

      if (response.data.success) {
        // if (profileTab === 'personal') setIsPersonalLocked(true);
        // if (profileTab === 'academic') setIsAcademicLocked(true);
        alert('Profile saved successfully!');
        fetchProfile(); // Refresh data
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(error.response?.data?.message || 'Error saving profile. Please try again.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File size should be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('photo', file);

        const response = await studentAPI.uploadPhoto(formData);

        if (response.data.success) {
          alert('Photo uploaded successfully!');
          fetchProfile();
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert(error.response?.data?.message || 'Error uploading photo');
      }
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

        const response = await studentAPI.uploadResume(formData);

        if (response.data.success) {
          setResumeFile(file);
          alert('Resume uploaded successfully!');
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

  const generateResume = async () => {
    try {
      alert('Generating resume... This may take a few seconds.');
      const response = await studentAPI.generateResume();
      if (response.data.success) {
        alert('Resume generated successfully!');
        fetchProfile();
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      alert('Failed to generate resume. Please ensure your profile is complete.');
    }
  };

  const [nonEligibleJobs, setNonEligibleJobs] = useState([]);

  const fetchJobs = async () => {
    try {
      const response = await studentAPI.getEligibleJobs();
      const jobsData = response.data.eligibleJobs || [];
      const nonEligibleData = response.data.nonEligibleJobs || [];

      setJobs(jobsData);
      setNonEligibleJobs(nonEligibleData);

      // Combine for filtering if needed, or keep separate. 
      // For now, let's just show eligible ones in default view, or maybe append ineligible ones at bottom?
      // User wants them shown. Let's combine them for the main list but mark them.

      // Transform non-eligible to match job structure but with eligibility flag
      const formattedNonEligible = nonEligibleData.map(item => ({
        ...item.job,
        isEligible: false,
        eligibilityIssues: item.reasons
      }));

      const allJobs = [...jobsData.map(j => ({ ...j, isEligible: true })), ...formattedNonEligible];

      // Sort: Eligible first, then by date? Or just default sort.
      // Let's keep eligible on top.
      allJobs.sort((a, b) => {
        if (a.isEligible === b.isEligible) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.isEligible ? -1 : 1;
      });

      setJobs(allJobs);
      setFilteredJobs(allJobs);

      // Populate jobEligibility map for UI consistency
      const eligibilityMap = {};
      allJobs.forEach(job => {
        eligibilityMap[job._id] = {
          isEligible: job.isEligible,
          issues: job.eligibilityIssues || []
        };
      });
      setJobEligibility(eligibilityMap);

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

      // Check if it's an eligibility error
      if (error.response?.data?.notEligible) {
        const issues = error.response?.data?.eligibilityIssues || [];
        const issuesText = issues.length > 0
          ? issues.join('\n')
          : 'You do not meet the eligibility criteria for this job.';

        alert(`You are not eligible for this job.\n\nReasons:\n${issuesText}`);
      }
      // Check if it's a profile incomplete error with section info
      else if (error.response?.data?.profileIncomplete) {
        const errorMsg = error.response?.data?.message || 'Please complete your profile before applying to jobs';
        const missingFields = error.response?.data?.missingFields || [];
        const section = error.response?.data?.section || '';

        let sectionName = '';
        if (section === 'personal_info') sectionName = 'Personal Information';
        if (section === 'academic_info') sectionName = 'Academic Information';

        if (missingFields.length > 0) {
          const formattedFields = missingFields.map(f =>
            f.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim()
          ).join(', ');

          const confirmSwitch = window.confirm(
            `${errorMsg}\n\n${sectionName ? `Section: ${sectionName}\n` : ''}Missing fields: ${formattedFields}\n\nWould you like to go to your profile to complete these details?`
          );

          if (confirmSwitch) {
            setActiveTab('profile');
          }
        } else {
          const confirmSwitch = window.confirm(
            `${errorMsg}\n\n${sectionName ? `Please complete: ${sectionName}\n` : ''}Would you like to go to your profile to complete these details?`
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

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
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

            <div className="flex items-center gap-4">
              {/* Profile Photo - Square Shape */}
              <div className="hidden sm:block">
                <div
                  className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-gray-100"
                  onClick={() => setActiveTab('profile')}
                  title="Click to view profile"
                >
                  {profileData.photoUrl ? (
                    <img
                      src={profileData.photoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNDAgNDBDNDYuNjI3NCA0MCA1MiAzNC42Mjc0IDUyIDI4QzUyIDIxLjM3MjYgNDYuNjI3NCAxNiA0MCAxNkMzMy4zNzI2IDE2IDI4IDIxLjM3MjYgMjggMjhDMjggMzQuNjI3NCAzMy4zNzI2IDQwIDQwIDQwWiIgZmlsbD0iIzlDQTNCMCIvPjxwYXRoIGQ9Ik00MCA0NEMyNi43NDUyIDQ0IDE2IDU0Ljc0NTIgMTYgNjhIMjRDMjQgNTkuMTYzNCAzMS4xNjM0IDUyIDQwIDUyQzQ4LjgzNjYgNTIgNTYgNTkuMTYzNCA1NiA2OEg2NEM2NCA1NC43NDUyIDUzLjI1NDggNDQgNDAgNDRaIiBmaWxsPSIjOUNBM0IwIi8+PC9zdmc+';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200">
                      <User className="h-10 w-10 text-indigo-600" />
                    </div>
                  )}
                </div>
              </div>

              <Button variant="outline" onClick={() => logout()} className="hidden sm:flex">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
              <Button variant="outline" onClick={() => logout()} className="sm:hidden p-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t pt-4">
              {/* Profile Section in Mobile Menu */}
              <div className="px-4 py-3 mb-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {/* Profile Photo */}
                  <div
                    className="w-16 h-16 rounded-lg overflow-hidden border-2 border-indigo-200 shadow-sm bg-gray-100 flex-shrink-0"
                    onClick={() => {
                      setActiveTab('profile');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {profileData.photoUrl ? (
                      <img
                        src={profileData.photoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMzIgMzJDMzcuMzAxOSAzMiA0MS42IDI3LjcwMTkgNDEuNiAyMi40QzQxLjYgMTcuMDk4MSAzNy4zMDE5IDEyLjggMzIgMTIuOEMyNi42OTgxIDEyLjggMjIuNCAxNy4wOTgxIDIyLjQgMjIuNEMyMi40IDI3LjcwMTkgMjYuNjk4MSAzMiAzMiAzMloiIGZpbGw9IiM5Q0EzQjAiLz48cGF0aCBkPSJNMzIgMzUuMkMyMS4zOTYyIDM1LjIgMTIuOCA0My43OTYyIDEyLjggNTQuNEgxOS4yQzE5LjIgNDcuMzMwNyAyNC45MzA3IDQxLjYgMzIgNDEuNkMzOS4wNjkzIDQxLjYgNDQuOCA0Ny4zMzA3IDQ0LjggNTQuNEg1MS4yQzUxLjIgNDMuNzk2MiA0Mi42MDM4IDM1LjIgMzIgMzUuMloiIGZpbGw9IiM5Q0EzQjAiLz48L3N2Zz4=';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-200">
                        <User className="h-8 w-8 text-indigo-600" />
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.fullName || 'Student'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">
                      {user?.department || 'Student'}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('applications');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${activeTab === 'applications'
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                    } px-4 py-3 text-left font-medium text-sm flex items-center gap-3 rounded-r`}
                >
                  <Clock className="h-5 w-5" />
                  My Applications
                </button>
                <button
                  onClick={() => {
                    setActiveTab('offers');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${activeTab === 'offers'
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                    } px-4 py-3 text-left font-medium text-sm flex items-center gap-3 rounded-r`}
                >
                  <Award className="h-5 w-5" />
                  My Offers {offers.length > 0 && `(${offers.length})`}
                </button>
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
              onClick={() => setActiveTab('applications')}
              className={`${activeTab === 'applications'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Clock className="h-4 w-4" />
              My Applications
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`${activeTab === 'offers'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Award className="h-4 w-4" />
              My Offers {offers.length > 0 && `(${offers.length})`}
            </button>
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

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Application Tracker</h2>
              <p className="text-gray-600">Track the status of all your job applications</p>
            </div>
            <ApplicationTracker />
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Offers</h2>

              {/* Placement Status Banner */}
              {isPlaced && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Award className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Congratulations! You are placed
                      </h3>
                      <p className="mt-1 text-sm text-green-700">
                        You have accepted an offer and are marked as placed. You cannot apply to other jobs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Offers List */}
              {offers.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No offers yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't received any job offers yet. Keep applying!
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {offers.map((offer) => (
                    <Card key={offer._id} className={`${offer.status === 'accepted' ? 'border-green-500 border-2' : ''}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{offer.companyName}</CardTitle>
                            <CardDescription className="mt-1">
                              Package: ₹{offer.package} LPA
                            </CardDescription>
                          </div>
                          {offer.status === 'accepted' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <Award className="h-4 w-4 mr-1" />
                              Final Offer
                            </span>
                          )}
                          {offer.status === 'pending' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                          {offer.status === 'rejected' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                              Not Accepted
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Offer Date: {new Date(offer.offerDate).toLocaleDateString()}
                          </div>

                          {offer.offerLetterUrl && (
                            <a
                              href={offer.offerLetterUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Offer Letter
                            </a>
                          )}

                          {offer.status === 'pending' && !isPlaced && (
                            <Button
                              onClick={() => handleAcceptOffer(offer._id)}
                              disabled={acceptingOfferId === offer._id}
                              className="w-full mt-4"
                            >
                              {acceptingOfferId === offer._id ? 'Accepting...' : 'Accept Offer'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
                            disabled={
                              appliedJobs.has(job._id || job.id) ||
                              applyingJobId === (job._id || job.id) ||
                              isJobExpired(job) ||
                              job.status !== 'active' ||
                              (jobEligibility[job._id || job.id]?.isEligible === false)
                            }
                            onClick={() => handleApply(job._id || job.id)}
                            variant={
                              appliedJobs.has(job._id || job.id) ||
                                isJobExpired(job) ||
                                job.status !== 'active' ||
                                (jobEligibility[job._id || job.id]?.isEligible === false)
                                ? "secondary"
                                : "default"
                            }
                            title={
                              job.status !== 'active'
                                ? 'This job is no longer accepting applications'
                                : jobEligibility[job._id || job.id]?.isEligible === false
                                  ? jobEligibility[job._id || job.id]?.issues?.join(', ') || 'You are not eligible for this job'
                                  : ''
                            }
                          >
                            {applyingJobId === (job._id || job.id)
                              ? 'Submitting...'
                              : appliedJobs.has(job._id || job.id)
                                ? 'Already Applied'
                                : isJobExpired(job)
                                  ? 'Application Closed'
                                  : job.status !== 'active'
                                    ? 'Job Closed'
                                    : jobEligibility[job._id || job.id]?.isEligible === false
                                      ? 'Not Eligible'
                                      : 'Apply for this Position'}
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => handleViewDetails(job)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Full Details
                          </Button>

                          {/* Show eligibility issues if not eligible */}
                          {jobEligibility[job._id || job.id]?.isEligible === false &&
                            jobEligibility[job._id || job.id]?.issues?.length > 0 && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm font-semibold text-red-800 mb-1">Why you're not eligible:</p>
                                <ul className="text-xs text-red-700 space-y-1">
                                  {jobEligibility[job._id || job.id]?.issues?.map((issue, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-red-500 mt-0.5">•</span>
                                      <span>{issue}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
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

            {/* Job Detail Modal */}
            <JobDetailModal
              job={selectedJob ? {
                ...selectedJob,
                jobId: selectedJob._id,
                eligible: selectedJob.isEligible,
                reasons: selectedJob.eligibilityIssues,
                applyStatus: appliedJobs.has(selectedJob._id) ? 'APPLIED' : (isPlaced ? 'PLACED' : 'NOT_APPLIED')
              } : null}
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onApply={() => {
                handleApply(selectedJob._id);
                handleCloseModal();
              }}
            />
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
            {/* Verification Status Banner */}
            <div className="mb-6">
              {verificationStatus === 'VERIFIED' ? (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-green-800 uppercase tracking-wider">Profile Verified</p>
                      <p className="text-sm text-green-700 mt-1">
                        Your profile has been verified by your department moderator. Your personal and academic details are now locked to maintain data integrity.
                      </p>
                    </div>
                  </div>
                </div>
              ) : verificationStatus === 'REJECTED' ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-red-800 uppercase tracking-wider">Verification Rejected</p>
                      <div className="mt-2 p-3 bg-white bg-opacity-50 rounded border border-red-100">
                        <p className="text-sm font-semibold text-red-900">Reason for rejection:</p>
                        <p className="text-sm text-red-800 mt-1 italic">"{verificationRejectionReason || 'No reason specified'}"</p>
                      </div>
                      <p className="text-sm text-red-700 mt-3">
                        Please update the requested information and save your changes. Your profile will be automatically resubmitted for verification.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-blue-800 uppercase tracking-wider">Pending Verification</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Your profile is currently waiting for moderator verification. You can still edit your details if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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

                      {/* Photo Upload */}
                      <div className="mb-6 flex items-center gap-4">
                        <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                          {profileData.photoUrl ? (
                            <img src={profileData.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div
                            onClick={() => !isPersonalLocked && fileInputRef.current?.click()}
                            className={`${isPersonalLocked ? 'cursor-not-allowed opacity-50 bg-gray-100' : 'cursor-pointer hover:bg-gray-50 bg-white'} select-none border border-gray-300 px-4 py-2 rounded-md text-sm font-medium shadow-sm inline-flex items-center gap-2`}
                          >
                            <Upload className="h-4 w-4" />
                            Upload Photo
                          </div>
                          <Input
                            ref={fileInputRef}
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                          />
                          <p className="text-xs text-gray-500 mt-1">Max size 2MB. JPG, PNG only.</p>
                        </div>
                      </div>

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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>

                        {/* NEW FIELDS - Identity & Academic */}
                        <div>
                          <Label htmlFor="rollNumber">Roll Number</Label>
                          <Input
                            id="rollNumber"
                            value={profileData.rollNumber}
                            onChange={(e) => setProfileData({ ...profileData, rollNumber: e.target.value })}
                            placeholder="Enter roll number"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                            placeholder="Enter first name"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                            placeholder="Enter last name"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="course">Course</Label>
                          <select
                            id="course"
                            value={profileData.course}
                            onChange={(e) => setProfileData({ ...profileData, course: e.target.value })}
                            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                          >
                            <option value="">Select Course</option>
                            <option value="BE">BE</option>
                            <option value="B.TECH">B.TECH</option>
                            <option value="ME">ME</option>
                            <option value="MBA">MBA</option>
                            <option value="MCA">MCA</option>
                            <option value="OTHER">OTHER</option>
                          </select>
                        </div>
                        {profileData.course === 'OTHER' && (
                          <div>
                            <Label htmlFor="courseOther">Specify Course</Label>
                            <Input
                              id="courseOther"
                              value={profileData.courseOther}
                              onChange={(e) => setProfileData({ ...profileData, courseOther: e.target.value })}
                              placeholder="Enter course name"
                              disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                              className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            />
                          </div>
                        )}
                        <div>
                          <Label htmlFor="passedOutYear">Passed Out Year</Label>
                          <Input
                            id="passedOutYear"
                            type="number"
                            value={profileData.passedOutYear}
                            onChange={(e) => setProfileData({ ...profileData, passedOutYear: e.target.value })}
                            placeholder="YYYY"
                            min="2000"
                            max="2100"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="careerPath">Career Path</Label>
                          <Input
                            id="careerPath"
                            value={profileData.careerPath}
                            onChange={(e) => setProfileData({ ...profileData, careerPath: e.target.value })}
                            placeholder="e.g., Software Development, Data Science"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label>Disability Status</Label>
                          <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="disabilityStatus"
                                value="none"
                                checked={profileData.disabilityStatus === 'none'}
                                onChange={(e) => setProfileData({ ...profileData, disabilityStatus: e.target.value })}
                                disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                              />
                              <span>None</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="disabilityStatus"
                                value="differently_abled"
                                checked={profileData.disabilityStatus === 'differently_abled'}
                                onChange={(e) => setProfileData({ ...profileData, disabilityStatus: e.target.value })}
                                disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                              />
                              <span>Differently Abled</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="disabilityStatus"
                                value="physically_challenged"
                                checked={profileData.disabilityStatus === 'physically_challenged'}
                                onChange={(e) => setProfileData({ ...profileData, disabilityStatus: e.target.value })}
                                disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                              />
                              <span>Physically Challenged</span>
                            </label>
                          </div>
                        </div>

                        {/* NEW FIELDS - Contact Information */}
                        <div className="col-span-2">
                          <h3 className="text-lg font-semibold mb-4 text-blue-600">Contact Information</h3>
                        </div>
                        <div>
                          <Label htmlFor="communicationEmail">Communication Email</Label>
                          <Input
                            id="communicationEmail"
                            type="email"
                            value={profileData.communicationEmail}
                            onChange={(e) => setProfileData({ ...profileData, communicationEmail: e.target.value })}
                            placeholder="primary@email.com"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="instituteEmail">Institute Email</Label>
                          <Input
                            id="instituteEmail"
                            type="email"
                            value={profileData.instituteEmail}
                            onChange={(e) => setProfileData({ ...profileData, instituteEmail: e.target.value })}
                            placeholder="student@college.edu"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="personalEmail">Personal Email</Label>
                          <Input
                            id="personalEmail"
                            type="email"
                            value={profileData.personalEmail}
                            onChange={(e) => setProfileData({ ...profileData, personalEmail: e.target.value })}
                            placeholder="personal@email.com"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="alternateEmail">Alternate Email</Label>
                          <Input
                            id="alternateEmail"
                            type="email"
                            value={profileData.alternateEmail}
                            onChange={(e) => setProfileData({ ...profileData, alternateEmail: e.target.value })}
                            placeholder="alternate@email.com"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                          <Input
                            id="whatsappNumber"
                            type="tel"
                            value={profileData.whatsappNumber}
                            onChange={(e) => setProfileData({ ...profileData, whatsappNumber: e.target.value })}
                            placeholder="+91 1234567890"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedInUrl">LinkedIn URL</Label>
                          <Input
                            id="linkedInUrl"
                            type="url"
                            value={profileData.linkedInUrl}
                            onChange={(e) => setProfileData({ ...profileData, linkedInUrl: e.target.value })}
                            placeholder="https://linkedin.com/in/yourprofile"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>

                        {/* Existing Family Fields */}
                        <div className="col-span-2">
                          <h3 className="text-lg font-semibold mb-4 text-blue-600">Family Information</h3>
                        </div>
                        <div>
                          <Label htmlFor="fatherName">Father's Name *</Label>
                          <Input
                            id="fatherName"
                            value={profileData.fatherName}
                            onChange={(e) => setProfileData({ ...profileData, fatherName: e.target.value })}
                            placeholder="Enter father's full name"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="motherName">Mother's Name *</Label>
                          <Input
                            id="motherName"
                            value={profileData.motherName}
                            onChange={(e) => setProfileData({ ...profileData, motherName: e.target.value })}
                            placeholder="Enter mother's full name"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="fatherPhone">Father's Phone</Label>
                          <Input
                            id="fatherPhone"
                            type="tel"
                            value={profileData.fatherPhone}
                            onChange={(e) => setProfileData({ ...profileData, fatherPhone: e.target.value })}
                            placeholder="+91 1234567890"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fatherOccupation">Father's Occupation</Label>
                          <Input
                            id="fatherOccupation"
                            value={profileData.fatherOccupation}
                            onChange={(e) => setProfileData({ ...profileData, fatherOccupation: e.target.value })}
                            placeholder="Enter father's occupation"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="motherPhone">Mother's Phone</Label>
                          <Input
                            id="motherPhone"
                            type="tel"
                            value={profileData.motherPhone}
                            onChange={(e) => setProfileData({ ...profileData, motherPhone: e.target.value })}
                            placeholder="+91 1234567890"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="motherOccupation">Mother's Occupation</Label>
                          <Input
                            id="motherOccupation"
                            value={profileData.motherOccupation}
                            onChange={(e) => setProfileData({ ...profileData, motherOccupation: e.target.value })}
                            placeholder="Enter mother's occupation"
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                          <Input
                            id="aadhaarNumber"
                            value={profileData.aadhaarNumber}
                            onChange={(e) => setProfileData({ ...profileData, aadhaarNumber: e.target.value })}
                            placeholder="Enter 12-digit Aadhaar number"
                            maxLength={12}
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="permanentAddress">Permanent Address</Label>
                          <Textarea
                            id="permanentAddress"
                            value={profileData.permanentAddress}
                            onChange={(e) => setProfileData({ ...profileData, permanentAddress: e.target.value })}
                            placeholder="Enter permanent address (if different from current)"
                            rows={2}
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                            className={isPersonalLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className={`flex items-center gap-2 ${isPersonalLocked ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400' : ''}`}
                        disabled={isPersonalLocked || verificationStatus === 'VERIFIED'}
                      >
                        <Save className="h-4 w-4" />
                        {isPersonalLocked ? 'Personal Information Locked' : 'Save Personal Information'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                                  disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                                  disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                            disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
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
                      <Button
                        type="submit"
                        className={`flex items-center gap-2 ${isAcademicLocked ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400' : ''}`}
                        disabled={isAcademicLocked || verificationStatus === 'VERIFIED'}
                      >
                        <Save className="h-4 w-4" />
                        {isAcademicLocked ? 'Academic Details Locked' : 'Save Academic Details'}
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
                                  onClick={() => window.open(getInlineViewUrl(resumeFile.url), '_blank')}
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
                <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
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
    </div >
  );
}
