import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, userAPI, authAPI, applicationAPI, verificationAPI, moderatorAPI } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Briefcase, LogOut, Plus, Trash2, Users, UserCheck, UserX, Lock, FileCheck, CheckCircle, XCircle, Clock, Edit, Eye, Menu, X, Mail, ShieldCheck } from 'lucide-react';
import ChangePassword from './ChangePassword';
import InviteStudents from './InviteStudents';
import ModeratorJobsList from './ModeratorJobsList';
import VerificationQueue from './moderator/VerificationQueue';

export default function ModeratorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, students: 0, applications: 0 });
  const [queueCount, setQueueCount] = useState(0);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingVerification, setIsProcessingVerification] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showViewStudentModal, setShowViewStudentModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    department: '',
  });

  const [editingJob, setEditingJob] = useState(null);
  const [showEditJobModal, setShowEditJobModal] = useState(false);

  // Search and Filter States
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [profileCompletionFilter, setProfileCompletionFilter] = useState('all'); // 'all', 'completed', 'incomplete'

  // Get department from user object or localStorage
  const moderatorDepartment = user?.department ||
    (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).department : null);

  // Filtered Students based on search and profile completion
  const filteredStudents = students.filter(student => {
    // Search filter
    const searchLower = studentSearchQuery.toLowerCase();
    const matchesSearch = !studentSearchQuery ||
      student.fullName?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.username?.toLowerCase().includes(searchLower);

    // Profile completion filter
    const matchesCompletion =
      profileCompletionFilter === 'all' ||
      (profileCompletionFilter === 'completed' && student.profileCompleted) ||
      (profileCompletionFilter === 'incomplete' && !student.profileCompleted);

    return matchesSearch && matchesCompletion;
  });

  // Update department when user data is available
  useEffect(() => {
    if (moderatorDepartment) {
      setNewStudentForm(prev => ({
        ...prev,
        department: moderatorDepartment
      }));
    }
  }, [moderatorDepartment]);

  useEffect(() => {
    fetchJobs();
    fetchStudents();
    fetchApplications();
    fetchQueueCount();
  }, []);

  const fetchQueueCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/moderator/verification/queue/count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setQueueCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching queue count:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await moderatorAPI.getJobs();
      // Handle API response structure - filter for active/total
      const jobsData = response.data.data || [];
      setJobs(jobsData);
      setStats((prev) => ({
        ...prev,
        total: jobsData.length,
        active: jobsData.filter((j) => j.status === 'active').length,
      }));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Error loading jobs. Please refresh the page.');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await userAPI.getAll('student');
      // Handle API response structure - users are nested in .data.users or .data
      const studentsData = Array.isArray(response.data) ? response.data : (response.data.users || []);

      // Get department from moderatorDepartment variable (has fallback logic)
      const dept = moderatorDepartment || user?.department;

      // Filter students by moderator's department
      const deptStudents = dept ? studentsData.filter(
        (s) => s.department === dept
      ) : studentsData;

      setStudents(deptStudents);
      setStats((prev) => ({
        ...prev,
        students: deptStudents.length,
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Error loading students. Please refresh the page.');
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await applicationAPI.getAll();
      const applicationsData = Array.isArray(response.data) ? response.data : (response.data.data || []);

      // Get department from moderatorDepartment variable (has fallback logic)
      const dept = moderatorDepartment || user?.department;

      // Filter applications by department - only show applications from students in moderator's department
      const deptApplications = dept ? applicationsData.filter(
        (app) => app.student?.department === dept
      ) : applicationsData;

      setApplications(deptApplications);
      setStats((prev) => ({
        ...prev,
        applications: deptApplications.length,
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Error loading applications. Please refresh the page.');
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      await applicationAPI.updateStatus(applicationId, status);
      fetchApplications();
      alert(`Application ${status} successfully!`);
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error updating application status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await jobAPI.delete(jobId);
        fetchJobs();
      } catch (error) {
        alert('Error deleting job');
      }
    }
  };

  const handleToggleStudentStatus = async (studentId, currentStatus) => {
    try {
      await userAPI.updateStatus(studentId, !currentStatus);
      fetchStudents();
      alert('Student status updated successfully!');
    } catch (error) {
      console.error('Error updating student status:', error);
      alert(error.response?.data?.message || 'Error updating student status');
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowEditStudentModal(true);
  };

  const handleViewStudent = async (student) => {
    try {
      // Fetch fresh detailed data for the student
      const response = await userAPI.getById(student._id || student.id);
      const detailedStudent = response.data.data || response.data;
      setViewingStudent(detailedStudent);
      setShowViewStudentModal(true);
    } catch (error) {
      console.error('Error fetching student details:', error);
      // Fallback to using existing data if fetch fails
      setViewingStudent(student);
      setShowViewStudentModal(true);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowEditJobModal(true);
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    try {
      await jobAPI.update(editingJob._id || editingJob.id, editingJob);
      setShowEditJobModal(false);
      setEditingJob(null);
      fetchJobs();
      alert('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      alert(error.response?.data?.message || 'Error updating job');
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      await userAPI.update(editingStudent._id || editingStudent.id, {
        fullName: editingStudent.fullName,
        email: editingStudent.email,
        username: editingStudent.username,
        department: editingStudent.department,

        // Contact Information
        primaryEmail: editingStudent.primaryEmail,
        secondaryEmail: editingStudent.secondaryEmail,
        primaryPhone: editingStudent.primaryPhone,
        secondaryPhone: editingStudent.secondaryPhone,
        phone: editingStudent.phone,
        address: editingStudent.address,

        // Personal Information
        dateOfBirth: editingStudent.dateOfBirth,
        gender: editingStudent.gender,
        nationality: editingStudent.nationality,

        // Passport Details
        passportNumber: editingStudent.passportNumber,
        passportPlaceOfIssue: editingStudent.passportPlaceOfIssue,
        passportIssueDate: editingStudent.passportIssueDate,
        passportExpiryDate: editingStudent.passportExpiryDate,

        // 10th Standard
        tenthInstitution: editingStudent.tenthInstitution,
        tenthPercentage: editingStudent.tenthPercentage,
        tenthBoard: editingStudent.tenthBoard,
        tenthYear: editingStudent.tenthYear,

        // 12th Standard
        twelfthInstitution: editingStudent.twelfthInstitution,
        twelfthPercentage: editingStudent.twelfthPercentage,
        twelfthBoard: editingStudent.twelfthBoard,
        twelfthYear: editingStudent.twelfthYear,

        // Current Education
        currentInstitution: editingStudent.currentInstitution,
        degree: editingStudent.degree,
        branch: editingStudent.branch,
        semester: editingStudent.semester,
        cgpa: editingStudent.cgpa,
        backlogs: editingStudent.backlogs,

        // Arrays
        semesterWiseGPA: editingStudent.semesterWiseGPA,
        arrearHistory: editingStudent.arrearHistory,
        skills: editingStudent.skills,
        internships: editingStudent.internships,
        extracurricular: editingStudent.extracurricular,

        // Professional Links
        github: editingStudent.github,
        linkedin: editingStudent.linkedin,
        portfolio: editingStudent.portfolio,

        // Resume
        resumeLink: editingStudent.resumeLink,

        // Profile Locking Status
        personalInfoLocked: editingStudent.personalInfoLocked,
        academicInfoLocked: editingStudent.academicInfoLocked,
      });
      setShowEditStudentModal(false);
      setEditingStudent(null);
      fetchStudents();
      alert('Student updated successfully!');
    } catch (error) {
      console.error('Error updating student:', error);
      alert(error.response?.data?.message || 'Error updating student');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...newStudentForm,
        role: 'student',
        department: user.department, // Automatically assigned to moderator's department
      };
      await userAPI.create(userData);
      setShowAddStudentModal(false);
      setNewStudentForm({
        username: '',
        email: '',
        fullName: '',
        password: '',
        department: user?.department || '',
      });
      fetchStudents();
      alert('Student added successfully!');
    } catch (error) {
      console.error('Error adding student:', error);
      alert(error.response?.data?.message || 'Error adding student');
    }
  };

  if (showChangePassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Moderator Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.fullName} • {user?.collegeName ? `${user.collegeName} • ` : ''}{user?.department}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Desktop buttons */}
              <div className="hidden lg:flex gap-2">
                <Button variant="outline" onClick={() => setShowChangePassword(true)}>
                  <Lock className="mr-2 h-4 w-4" /> Change Password
                </Button>
                <Button variant="outline" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
              {/* Burger menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 py-4 border-t border-gray-200 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('jobs');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'jobs'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Briefcase className="inline-block mr-2 h-4 w-4" />
                Job Postings
              </button>
              <button
                onClick={() => {
                  setActiveTab('students');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'students'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Users className="inline-block mr-2 h-4 w-4" />
                My Students ({user?.department})
              </button>
              <button
                onClick={() => {
                  setActiveTab('invitations');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'invitations'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Mail className="inline-block mr-2 h-4 w-4" />
                Invite Students
              </button>
              <button
                onClick={() => {
                  setActiveTab('verification');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'verification'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <FileCheck className="inline-block mr-2 h-4 w-4" />
                Verification Queue
                {queueCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {queueCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('applications');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'applications'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <FileCheck className="inline-block mr-2 h-4 w-4" />
                Applications ({stats.applications})
              </button>
              <div className="border-t border-gray-200 pt-2 mt-2 space-y-2">
                <button
                  onClick={() => {
                    setShowChangePassword(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <Lock className="inline-block mr-2 h-4 w-4" />
                  Change Password
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="inline-block mr-2 h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Department Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 hidden lg:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`${activeTab === 'jobs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
              >
                Job Postings
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`${activeTab === 'students'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
              >
                My Students ({user?.department})
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`${activeTab === 'invitations'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
              >
                Invite Students
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`${activeTab === 'verification'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium relative`}
              >
                Verification Queue
                {queueCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {queueCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`${activeTab === 'applications'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
              >
                Applications ({stats.applications})
              </button>
            </nav>
          </div>
        </div>

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <>
            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage job postings for your college</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/create-job')}>
                  <Plus className="mr-2 h-4 w-4" /> Create New Job Posting
                </Button>
              </CardContent>
            </Card>

            {/* Jobs List */}
            <ModeratorJobsList onEdit={handleEditJob} />
          </>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold">Students in {user?.department}</h3>
                <p className="text-sm text-gray-600">Manage students in your department</p>
                <p className="text-xs text-gray-500 mt-1">You can add, edit, and block students in your department</p>
              </div>
              <Button onClick={() => {
                const dept = moderatorDepartment || user?.department || '';
                setNewStudentForm({
                  username: '',
                  email: '',
                  fullName: '',
                  password: '',
                  department: dept,
                });
                setShowAddStudentModal(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </div>

            {/* Search and Filter Section */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Search Input */}
                  <div>
                    <Label htmlFor="student-search" className="text-sm font-medium mb-2 block">
                      Search Students
                    </Label>
                    <Input
                      id="student-search"
                      type="text"
                      placeholder="Search by name, email, or username..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Profile Completion Filter */}
                  <div>
                    <Label htmlFor="profile-filter" className="text-sm font-medium mb-2 block">
                      Profile Status
                    </Label>
                    <select
                      id="profile-filter"
                      value={profileCompletionFilter}
                      onChange={(e) => setProfileCompletionFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Students</option>
                      <option value="completed">Profile Completed</option>
                      <option value="incomplete">Profile Incomplete</option>
                    </select>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <p className="text-gray-600">
                    Showing {filteredStudents.length} of {students.length} students
                  </p>
                  {(studentSearchQuery || profileCompletionFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setStudentSearchQuery('');
                        setProfileCompletionFilter('all');
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <Card key={student._id || student.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{student.fullName}</h4>
                          {/* Profile Completion Badge */}
                          {student.profileCompleted ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Profile Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Incomplete
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <p className="text-sm text-gray-500">
                          Username: {student.username} • Department: {student.department}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Status:{' '}
                          <span
                            className={`font-semibold ${student.isActive ? 'text-green-600' : 'text-red-600'
                              }`}
                          >
                            {student.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {student.isApproved === false && (
                            <span className="ml-2 text-yellow-600 font-semibold">• Pending Approval</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewStudent(student)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button
                          variant={student.isActive ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => handleToggleStudentStatus(student._id || student.id, student.isActive)}
                        >
                          {student.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-1" /> Block
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" /> Unblock
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredStudents.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-500 py-8">
                      {studentSearchQuery || profileCompletionFilter !== 'all'
                        ? 'No students found matching your search criteria'
                        : `No students found in ${user?.department} department`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <InviteStudents userDepartment={moderatorDepartment} />
        )}

        {/* Verification Queue Tab */}
        {activeTab === 'verification' && (
          <VerificationQueue />
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Job Applications</CardTitle>
                    <CardDescription>Applications from students in {user?.department} department</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((application) => (
                    <Card key={application.id || application._id} className="border-l-4" style={{
                      borderLeftColor:
                        application.status === 'accepted' ? '#10b981' :
                          application.status === 'rejected' ? '#ef4444' :
                            application.status === 'withdrawn' ? '#6b7280' :
                              '#f59e0b'
                    }}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-lg">{application.student?.fullName || 'Unknown Student'}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {application.status?.toUpperCase()}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm text-gray-600">
                              <p><span className="font-medium">Job:</span> {application.job?.title || 'Unknown'} at {application.job?.company || 'Unknown Company'}</p>
                              <p><span className="font-medium">Student Email:</span> {application.student?.email || 'N/A'}</p>
                              <p><span className="font-medium">Department:</span> {application.student?.department || 'N/A'}</p>
                              <p><span className="font-medium">Applied:</span> {application.appliedAt ? new Date(application.appliedAt).toLocaleString() : 'N/A'}</p>
                            </div>
                          </div>

                          {application.status === 'pending' && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleUpdateApplicationStatus(application.id || application._id, 'accepted')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" /> Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUpdateApplicationStatus(application.id || application._id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </div>
                          )}

                          {application.status !== 'pending' && (
                            <div className="ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateApplicationStatus(application.id || application._id, 'pending')}
                              >
                                <Clock className="h-4 w-4 mr-1" /> Reset to Pending
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {applications.length === 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-center text-gray-500 py-8">
                          No applications from {user?.department} students yet
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Student to {user?.department}</CardTitle>
              <CardDescription>Create a new student account for your department</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newStudentForm.fullName}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudentForm.email}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newStudentForm.username}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, username: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newStudentForm.password}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, password: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newStudentForm.department || moderatorDepartment || 'Not Set'}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Students will be added to this department
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Debug: Form dept: {newStudentForm.department || 'empty'} | User dept: {moderatorDepartment || 'empty'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddStudentModal(false);
                      setNewStudentForm({
                        username: '',
                        email: '',
                        fullName: '',
                        password: '',
                        department: user?.department || '',
                      });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add Student
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <Card className="w-full max-w-5xl my-8 max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
              <CardTitle className="text-2xl">Edit Student Profile - {editingStudent.fullName}</CardTitle>
              <CardDescription className="text-green-100">Update student information</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateStudent} className="space-y-6">
                {/* Profile Controls (Moderator Only) */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                  <h4 className="text-lg font-semibold mb-4 text-blue-800 border-b border-blue-200 pb-2">Profile Protection Controls</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex flex-col">
                        <span className="font-medium text-blue-900">Personal Information Section</span>
                        <span className="text-xs text-blue-600">
                          {editingStudent.personalInfoLocked ? 'Locked (Student cannot edit)' : 'Unlocked (Student can edit)'}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!editingStudent.personalInfoLocked}
                          onChange={(e) => setEditingStudent({ ...editingStudent, personalInfoLocked: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex flex-col">
                        <span className="font-medium text-blue-900">Academic Details Section</span>
                        <span className="text-xs text-blue-600">
                          {editingStudent.academicInfoLocked ? 'Locked (Student cannot edit)' : 'Unlocked (Student can edit)'}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!editingStudent.academicInfoLocked}
                          onChange={(e) => setEditingStudent({ ...editingStudent, academicInfoLocked: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-fullName">Full Name *</Label>
                      <Input
                        id="edit-fullName"
                        value={editingStudent.fullName || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-username">Username *</Label>
                      <Input
                        id="edit-username"
                        value={editingStudent.username || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                      <Input
                        id="edit-dateOfBirth"
                        type="date"
                        value={editingStudent.dateOfBirth ? editingStudent.dateOfBirth.split('T')[0] : ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-gender">Gender</Label>
                      <select
                        id="edit-gender"
                        value={editingStudent.gender || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="edit-nationality">Nationality</Label>
                      <Input
                        id="edit-nationality"
                        value={editingStudent.nationality || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, nationality: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-department">Department</Label>
                      <Input
                        id="edit-department"
                        value={editingStudent.department || user?.department}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-primaryEmail">Primary Email</Label>
                      <Input
                        id="edit-primaryEmail"
                        type="email"
                        value={editingStudent.primaryEmail || editingStudent.email || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, primaryEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-secondaryEmail">Secondary Email</Label>
                      <Input
                        id="edit-secondaryEmail"
                        type="email"
                        value={editingStudent.secondaryEmail || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, secondaryEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-primaryPhone">Primary Phone</Label>
                      <Input
                        id="edit-primaryPhone"
                        value={editingStudent.primaryPhone || editingStudent.phone || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, primaryPhone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-secondaryPhone">Secondary Phone</Label>
                      <Input
                        id="edit-secondaryPhone"
                        value={editingStudent.secondaryPhone || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, secondaryPhone: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-address">Address</Label>
                      <Textarea
                        id="edit-address"
                        value={editingStudent.address || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information - 10th Standard */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">10th Standard</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="edit-tenthInstitution">Institution</Label>
                      <Input
                        id="edit-tenthInstitution"
                        value={editingStudent.tenthInstitution || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, tenthInstitution: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-tenthBoard">Board</Label>
                      <Input
                        id="edit-tenthBoard"
                        value={editingStudent.tenthBoard || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, tenthBoard: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-tenthPercentage">Percentage</Label>
                      <Input
                        id="edit-tenthPercentage"
                        type="number"
                        step="0.01"
                        value={editingStudent.tenthPercentage || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, tenthPercentage: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-tenthYear">Year</Label>
                      <Input
                        id="edit-tenthYear"
                        type="number"
                        value={editingStudent.tenthYear || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, tenthYear: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information - 12th Standard */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">12th Standard</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="edit-twelfthInstitution">Institution</Label>
                      <Input
                        id="edit-twelfthInstitution"
                        value={editingStudent.twelfthInstitution || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, twelfthInstitution: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-twelfthBoard">Board</Label>
                      <Input
                        id="edit-twelfthBoard"
                        value={editingStudent.twelfthBoard || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, twelfthBoard: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-twelfthPercentage">Percentage</Label>
                      <Input
                        id="edit-twelfthPercentage"
                        type="number"
                        step="0.01"
                        value={editingStudent.twelfthPercentage || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, twelfthPercentage: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-twelfthYear">Year</Label>
                      <Input
                        id="edit-twelfthYear"
                        type="number"
                        value={editingStudent.twelfthYear || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, twelfthYear: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Current Education */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Current Education</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-currentInstitution">Institution</Label>
                      <Input
                        id="edit-currentInstitution"
                        value={editingStudent.currentInstitution || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, currentInstitution: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-degree">Degree</Label>
                      <Input
                        id="edit-degree"
                        value={editingStudent.degree || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, degree: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-branch">Branch</Label>
                      <Input
                        id="edit-branch"
                        value={editingStudent.branch || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, branch: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-semester">Semester</Label>
                      <Input
                        id="edit-semester"
                        type="number"
                        value={editingStudent.semester || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, semester: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-cgpa">Overall CGPA</Label>
                      <Input
                        id="edit-cgpa"
                        type="number"
                        step="0.01"
                        value={editingStudent.cgpa || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, cgpa: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-backlogs">Backlogs</Label>
                      <Input
                        id="edit-backlogs"
                        type="number"
                        value={editingStudent.backlogs || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, backlogs: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Links */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Professional Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-github">GitHub</Label>
                      <Input
                        id="edit-github"
                        type="url"
                        value={editingStudent.github || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, github: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-linkedin">LinkedIn</Label>
                      <Input
                        id="edit-linkedin"
                        type="url"
                        value={editingStudent.linkedin || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, linkedin: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-portfolio">Portfolio</Label>
                      <Input
                        id="edit-portfolio"
                        type="url"
                        value={editingStudent.portfolio || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, portfolio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-resumeLink">Resume Link</Label>
                      <Input
                        id="edit-resumeLink"
                        type="url"
                        value={editingStudent.resumeLink || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, resumeLink: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Passport Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Passport Details (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-passportNumber">Passport Number</Label>
                      <Input
                        id="edit-passportNumber"
                        value={editingStudent.passportNumber || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, passportNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-passportPlaceOfIssue">Place of Issue</Label>
                      <Input
                        id="edit-passportPlaceOfIssue"
                        value={editingStudent.passportPlaceOfIssue || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, passportPlaceOfIssue: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-passportIssueDate">Issue Date</Label>
                      <Input
                        id="edit-passportIssueDate"
                        type="date"
                        value={editingStudent.passportIssueDate ? editingStudent.passportIssueDate.split('T')[0] : ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, passportIssueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-passportExpiryDate">Expiry Date</Label>
                      <Input
                        id="edit-passportExpiryDate"
                        type="date"
                        value={editingStudent.passportExpiryDate ? editingStudent.passportExpiryDate.split('T')[0] : ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, passportExpiryDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditStudentModal(false);
                      setEditingStudent(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Student Profile Modal */}
      {showViewStudentModal && viewingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <Card className="w-full max-w-5xl my-8 max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Student Profile - {viewingStudent.fullName}</CardTitle>
                  <CardDescription className="text-blue-100">Complete profile information</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    setShowViewStudentModal(false);
                    handleEditStudent(viewingStudent);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Full Name</p>
                    <p className="font-medium">{viewingStudent.fullName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Username</p>
                    <p className="font-medium">{viewingStudent.username || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Department</p>
                    <p className="font-medium">{viewingStudent.department || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Date of Birth</p>
                    <p className="font-medium">{viewingStudent.dateOfBirth ? new Date(viewingStudent.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Gender</p>
                    <p className="font-medium">{viewingStudent.gender || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Profile Status</p>
                    <div className="flex gap-2 mt-1">
                      {viewingStudent.personalInfoLocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          <Lock className="h-3 w-3 mr-1" /> Personal Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Personal Unlocked
                        </span>
                      )}
                      {viewingStudent.academicInfoLocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          <Lock className="h-3 w-3 mr-1" /> Academic Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Academic Unlocked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Primary Email</p>
                    <p className="font-medium">{viewingStudent.primaryEmail || viewingStudent.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Secondary Email</p>
                    <p className="font-medium">{viewingStudent.secondaryEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Primary Phone</p>
                    <p className="font-medium">{viewingStudent.primaryPhone || viewingStudent.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Secondary Phone</p>
                    <p className="font-medium">{viewingStudent.secondaryPhone || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500 text-xs">Address</p>
                    <p className="font-medium">{viewingStudent.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Passport Details */}
              {(viewingStudent.passportNumber || viewingStudent.passportPlaceOfIssue) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Passport Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Passport Number</p>
                      <p className="font-medium">{viewingStudent.passportNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Place of Issue</p>
                      <p className="font-medium">{viewingStudent.passportPlaceOfIssue || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Issue Date</p>
                      <p className="font-medium">{viewingStudent.passportIssueDate ? new Date(viewingStudent.passportIssueDate).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Expiry Date</p>
                      <p className="font-medium">{viewingStudent.passportExpiryDate ? new Date(viewingStudent.passportExpiryDate).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Academic Information</h4>

                {/* 10th Standard */}
                <div className="mb-4">
                  <p className="font-semibold text-gray-700 mb-2">10th Standard</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Institution</p>
                      <p className="font-medium">{viewingStudent.tenthInstitution || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Board</p>
                      <p className="font-medium">{viewingStudent.tenthBoard || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Percentage</p>
                      <p className="font-medium">{viewingStudent.tenthPercentage ? `${viewingStudent.tenthPercentage}%` : 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Year</p>
                      <p className="font-medium">{viewingStudent.tenthYear || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* 12th Standard */}
                <div className="mb-4">
                  <p className="font-semibold text-gray-700 mb-2">12th Standard</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Institution</p>
                      <p className="font-medium">{viewingStudent.twelfthInstitution || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Board</p>
                      <p className="font-medium">{viewingStudent.twelfthBoard || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Percentage</p>
                      <p className="font-medium">{viewingStudent.twelfthPercentage ? `${viewingStudent.twelfthPercentage}%` : 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Year</p>
                      <p className="font-medium">{viewingStudent.twelfthYear || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Current Education */}
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Current Education</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Institution</p>
                      <p className="font-medium">{viewingStudent.currentInstitution || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Degree</p>
                      <p className="font-medium">{viewingStudent.degree || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Branch</p>
                      <p className="font-medium">{viewingStudent.branch || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Semester</p>
                      <p className="font-medium">{viewingStudent.semester || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Overall CGPA</p>
                      <p className="font-medium text-blue-600 text-lg">{viewingStudent.cgpa || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Backlogs</p>
                      <p className="font-medium">{viewingStudent.backlogs !== undefined ? viewingStudent.backlogs : 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Semester-wise GPA */}
              {viewingStudent.semesterWiseGPA && viewingStudent.semesterWiseGPA.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Semester-wise GPA</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left">Semester</th>
                          <th className="px-4 py-2 text-left">SGPA</th>
                          <th className="px-4 py-2 text-left">Cumulative CGPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingStudent.semesterWiseGPA.map((sem, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-2">Semester {sem.semester || idx + 1}</td>
                            <td className="px-4 py-2 font-medium">{sem.sgpa || 'N/A'}</td>
                            <td className="px-4 py-2 font-medium text-blue-600">{sem.cgpa || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Arrear History */}
              {viewingStudent.arrearHistory && viewingStudent.arrearHistory.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Arrear History</h4>
                  <div className="space-y-2">
                    {viewingStudent.arrearHistory.map((arr, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border-l-4 border-red-400">
                        <p className="font-medium">{arr.subject || arr.subjectName}</p>
                        <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mt-1">
                          <span>Code: {arr.code || arr.subjectCode || 'N/A'}</span>
                          <span>Semester: {arr.semester || 'N/A'}</span>
                          <span className={`font-medium ${arr.status === 'cleared' ? 'text-green-600' : 'text-red-600'}`}>
                            {arr.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {viewingStudent.skills && viewingStudent.skills.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingStudent.skills.map((skill, index) => {
                      const skillObj = typeof skill === 'string' ? { name: skill, category: 'technical' } : skill;
                      const colors = {
                        technical: 'bg-blue-100 text-blue-700',
                        soft: 'bg-green-100 text-green-700',
                        tools: 'bg-purple-100 text-purple-700',
                        languages: 'bg-orange-100 text-orange-700'
                      };
                      return (
                        <span key={index} className={`px-3 py-1 rounded-full text-sm ${colors[skillObj.category] || colors.technical}`}>
                          {skillObj.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Internships */}
              {viewingStudent.internships && viewingStudent.internships.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Internships</h4>
                  <div className="space-y-3">
                    {viewingStudent.internships.map((intern, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border-l-4 border-blue-400">
                        <p className="font-semibold text-gray-800">{intern.company}</p>
                        <p className="text-sm text-gray-600">Role: {intern.role}</p>
                        <p className="text-sm text-gray-600">Duration: {intern.duration}</p>
                        {intern.description && <p className="text-sm text-gray-500 mt-1">{intern.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracurricular Activities */}
              {viewingStudent.extracurricular && viewingStudent.extracurricular.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Extracurricular Activities</h4>
                  <div className="space-y-2">
                    {viewingStudent.extracurricular.map((activity, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border-l-4 border-green-400">
                        <p className="font-semibold text-gray-800">{activity.activity || activity.title}</p>
                        {activity.description && <p className="text-sm text-gray-600 mt-1">{activity.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Links */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Professional Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">GitHub</p>
                    {viewingStudent.github ? (
                      <a href={viewingStudent.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                        {viewingStudent.github}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-400">Not provided</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">LinkedIn</p>
                    {viewingStudent.linkedin ? (
                      <a href={viewingStudent.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                        {viewingStudent.linkedin}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-400">Not provided</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Portfolio</p>
                    {viewingStudent.portfolio ? (
                      <a href={viewingStudent.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                        {viewingStudent.portfolio}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-400">Not provided</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Resume</p>
                    {viewingStudent.resumeLink ? (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          let url = viewingStudent.resumeLink;
                          // Transform Cloudinary URLs for inline viewing using Google Docs Viewer
                          if (url.includes('cloudinary.com') && url.includes('/raw/upload/')) {
                            url = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                          } else if (url.includes('cloudinary.com') && url.includes('/image/upload/') && url.includes('.pdf')) {
                            url = url.replace('/image/upload/', '/image/upload/fl_attachment:false/');
                          }
                          // Transform Google Drive links
                          if (url.includes('drive.google.com') && url.includes('/file/d/')) {
                            const fileId = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                            if (fileId) {
                              url = `https://drive.google.com/file/d/${fileId}/preview`;
                            }
                          }
                          window.open(url, '_blank');
                        }}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        View Resume
                      </a>
                    ) : (
                      <p className="font-medium text-gray-400">Not provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Account Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${viewingStudent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {viewingStudent.status || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Role</p>
                    <p className="font-medium capitalize">{viewingStudent.role || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Created At</p>
                    <p className="font-medium">
                      {viewingStudent.createdAt ? new Date(viewingStudent.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Last Updated</p>
                    <p className="font-medium">
                      {viewingStudent.updatedAt ? new Date(viewingStudent.updatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewStudentModal(false);
                    setViewingStudent(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Edit Job Modal */}
      {showEditJobModal && editingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Job Posting</CardTitle>
              <CardDescription>Update job details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title">Job Title</Label>
                    <Input
                      id="edit-title"
                      value={editingJob.title}
                      onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-company">Company Name</Label>
                    <Input
                      id="edit-company"
                      value={editingJob.companyName || editingJob.company}
                      onChange={(e) => setEditingJob({ ...editingJob, companyName: e.target.value, company: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      value={editingJob.location}
                      onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-salary">CTC/Salary</Label>
                    <Input
                      id="edit-salary"
                      value={editingJob.salary}
                      onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                      placeholder="e.g., 5-7 LPA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-jobType">Job Type</Label>
                    <select
                      id="edit-jobType"
                      value={editingJob.jobType}
                      onChange={(e) => setEditingJob({ ...editingJob, jobType: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="internship">Internship</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <select
                      id="edit-status"
                      value={editingJob.status}
                      onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-deadline">Application Deadline</Label>
                  <Input
                    id="edit-deadline"
                    type="datetime-local"
                    value={editingJob.deadline ? new Date(editingJob.deadline).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingJob({ ...editingJob, deadline: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Job Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingJob.description}
                    onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditJobModal(false);
                      setEditingJob(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Update Job
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
