import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, userAPI, authAPI, applicationAPI, adminAPI } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Briefcase, Users, LogOut, Plus, Trash2, UserCheck, UserX, Lock, Edit, Menu, X, LayoutDashboard, UserCog, GraduationCap, CheckCircle, XCircle, Clock, Upload, Download, Mail } from 'lucide-react';
import ChangePassword from './ChangePassword';
import InviteStudents from './InviteStudents';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ jobs: 0, students: 0, moderators: 0 });
  const [jobs, setJobs] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userType, setUserType] = useState('moderator');
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    department: '',
  });
  const [bulkUploadData, setBulkUploadData] = useState('');
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // New dashboard metrics state
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalCompaniesPosted: 0,
    totalStudentsPlaced: 0,
    deptWisePlacement: [],
    companyWisePlacement: [],
    jobsSummary: [],
  });

  useEffect(() => {
    // Check if user has valid token
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      console.error('No token or user found - redirecting to login');
      navigate('/');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (!userData.collegeId) {
        console.error('User has no college assigned - redirecting to login');
        logout();
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Invalid user data - redirecting to login');
      logout();
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [jobsRes, modsRes, studentsRes, appsRes] = await Promise.all([
        jobAPI.getAll(null, { includeExpired: true }),
        userAPI.getAll('moderator'),
        userAPI.getAll('student'),
        applicationAPI.getAll(),
      ]);

      // Handle API response structure - jobs are nested in .data.jobs or .data
      const jobsData = Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data.jobs || []);
      const modsData = Array.isArray(modsRes.data) ? modsRes.data : (modsRes.data.users || []);
      const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data.users || []);
      const appsData = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data.data || []);

      setJobs(jobsData);
      setModerators(modsData);
      setStudents(studentsData);
      setApplications(appsData);

      setStats({
        jobs: jobsData.length,
        students: studentsData.length,
        moderators: modsData.length,
      });

      // Fetch enhanced dashboard metrics
      try {
        const dashboardRes = await adminAPI.getDashboard();
        if (dashboardRes.data.success) {
          setDashboardMetrics(dashboardRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        // Don't fail the whole dashboard if metrics fail
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      alert('Error loading dashboard data. Please refresh the page.');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await jobAPI.delete(jobId);
        fetchDashboardData();
      } catch (error) {
        alert('Error deleting job');
      }
    }
  };

  const handleEditJob = (job) => {
    setEditingJob({
      id: job._id || job.id,
      title: job.title || job.jobCategory || '',
      company: job.company || job.companyName || '',
      description: job.description || job.jobDescription || '',
      salary: job.salary || '',
      location: job.location || '',
      jobType: job.jobType || 'full-time',
      deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 16) : '',
      status: job.status || 'active',
      requirements: job.requirements || ''
    });
    setShowEditJobModal(true);
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    try {
      const { id, ...updateData } = editingJob;
      await jobAPI.update(id, updateData);
      setShowEditJobModal(false);
      setEditingJob(null);
      fetchDashboardData();
      alert('Job updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating job');
    }
  };

  const handleChangeJobStatus = async (jobId, newStatus) => {
    try {
      await jobAPI.changeStatus(jobId, newStatus);
      fetchDashboardData();
      alert(`Job status changed to ${newStatus}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error changing job status');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await userAPI.updateStatus(userId, !currentStatus);
      await fetchDashboardData();
      alert('User status updated successfully!');
    } catch (error) {
      console.error('Error updating user status:', error);

      if (error.isAuthError) {
        return;
      }

      const errorMsg = error.response?.data?.message || error.message || 'Error updating user status. Please try again.';
      alert(errorMsg);
    }
  };

  const handleApproveUser = async (userId, isApproved) => {
    try {
      const response = await userAPI.approve(userId, isApproved);
      await fetchDashboardData();
      alert(isApproved ? 'User approved successfully!' : 'User approval revoked');
    } catch (error) {
      console.error('Error updating approval status:', error);

      // Don't show error if it's an auth error (will redirect)
      if (error.isAuthError) {
        return;
      }

      // Get user-friendly error message
      const errorMsg = error.response?.data?.message || error.message || 'Error updating approval status. Please try again.';
      alert(errorMsg);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(userId);
        await fetchDashboardData();
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);

        if (error.isAuthError) {
          return;
        }

        const errorMsg = error.response?.data?.message || error.message || 'Error deleting user. Please try again.';
        alert(errorMsg);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...newUserForm,
        collegeId: user.collegeId,
      };

      if (userType === 'moderator') {
        // Use specific admin API for moderators
        await adminAPI.createModerator({
          ...userData,
          departments: [newUserForm.department],
          department: newUserForm.department
        });
      } else {
        // For students, use the general user creation endpoint
        await userAPI.create({
          ...userData,
          role: userType
        });
      }

      setShowAddUserModal(false);
      setNewUserForm({
        username: '',
        email: '',
        fullName: '',
        password: '',
        department: '',
      });
      fetchDashboardData();
      alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} added successfully!`);
    } catch (error) {
      console.error('Add user error:', error);
      alert(error.response?.data?.message || error.response?.data?.detail || `Error adding ${userType}`);
    }
  };

  const handleBulkUpload = async () => {
    try {
      setBulkUploading(true);
      setBulkUploadResults(null);
      setUploadProgress({ current: 0, total: 0 });

      // Validate and parse CSV data
      const lines = bulkUploadData.trim().split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('Error: CSV must contain at least a header row and one data row');
        setBulkUploading(false);
        return;
      }

      // Validate header
      const header = lines[0].toLowerCase().replace(/\s/g, '');
      const expectedHeader = 'username,email,fullname,password,department';
      if (header !== expectedHeader) {
        alert(`Error: Invalid CSV header.\nExpected: ${expectedHeader}\nReceived: ${header}\n\nPlease download the template and use the correct format.`);
        setBulkUploading(false);
        return;
      }

      const results = { successful: 0, failed: 0, skipped: 0, errors: [], details: [] };
      const totalRecords = lines.length - 1;
      setUploadProgress({ current: 0, total: totalRecords });

      // Valid departments
      const validDepartments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'ISE', 'AIML', 'AIML_DS', 'DS', 'MBA', 'MCA'];

      for (let i = 1; i < lines.length; i++) {
        const lineNumber = i + 1;
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) {
          results.skipped++;
          results.errors.push(`Line ${lineNumber}: Empty line skipped`);
          continue;
        }

        // Parse CSV line (handle commas in quoted fields)
        const fields = line.match(/(?:[^,"]+|"[^"]*")+/g);

        if (!fields || fields.length < 5) {
          results.skipped++;
          results.errors.push(`Line ${lineNumber}: Insufficient fields (expected 5, got ${fields?.length || 0})`);
          continue;
        }

        const [username, email, fullName, password, department] = fields.map(s => s.trim().replace(/^"|"$/g, ''));

        // Validate required fields
        if (!username || !email || !fullName || !password || !department) {
          results.skipped++;
          const missingFields = [];
          if (!username) missingFields.push('username');
          if (!email) missingFields.push('email');
          if (!fullName) missingFields.push('fullName');
          if (!password) missingFields.push('password');
          if (!department) missingFields.push('department');
          results.errors.push(`Line ${lineNumber}: Missing fields: ${missingFields.join(', ')}`);
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.skipped++;
          results.errors.push(`Line ${lineNumber} (${username}): Invalid email format`);
          continue;
        }

        // Validate username (no spaces, alphanumeric)
        const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
        if (!usernameRegex.test(username)) {
          results.skipped++;
          results.errors.push(`Line ${lineNumber} (${username}): Username can only contain letters, numbers, dots, hyphens, and underscores`);
          continue;
        }

        // Validate password length
        if (password.length < 6) {
          results.skipped++;
          results.errors.push(`Line ${lineNumber} (${username}): Password must be at least 6 characters`);
          continue;
        }

        // Validate department
        const deptUpper = department.toUpperCase();
        if (!validDepartments.includes(deptUpper)) {
          results.skipped++;
          results.errors.push(`Line ${lineNumber} (${username}): Invalid department '${department}'. Valid: ${validDepartments.join(', ')}`);
          continue;
        }

        // Update progress
        setUploadProgress({ current: i, total: totalRecords });

        // Attempt to create user
        try {
          await userAPI.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            fullName,
            password,
            department: deptUpper,
            role: 'student',
            collegeId: user.collegeId,
          });
          results.successful++;
          results.details.push({ line: lineNumber, username, status: 'success' });
        } catch (error) {
          results.failed++;
          const errorMsg = error.response?.data?.message || error.message || 'Unknown error';

          // Provide more specific error messages
          let friendlyError = errorMsg;
          if (errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
            friendlyError = 'Username or email already exists';
          } else if (errorMsg.includes('validation')) {
            friendlyError = 'Validation failed';
          }

          results.errors.push(`Line ${lineNumber} (${username}): ${friendlyError}`);
          results.details.push({ line: lineNumber, username, status: 'failed', error: friendlyError });
        }

        // Small delay to prevent overwhelming the server
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setBulkUploadResults(results);
      setUploadProgress({ current: totalRecords, total: totalRecords });

      // Refresh dashboard data if any users were created
      if (results.successful > 0) {
        await fetchDashboardData();
      }

      // Clear data only if everything was successful
      if (results.failed === 0 && results.skipped === 0) {
        setBulkUploadData('');
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      alert('Error processing bulk upload: ' + (error.message || 'Unknown error occurred. Please check your CSV format and try again.'));
    } finally {
      setBulkUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'username,email,fullName,password,department\njohndoe,john@example.com,John Doe,password123,CSE\njanedoe,jane@example.com,Jane Doe,password456,ECE\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditUserClick = (user) => {
    setEditingUser({
      id: user._id || user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      department: user.department || '',
      role: user.role,
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const { id, ...updateData } = editingUser;
      await userAPI.update(id, updateData);
      setShowEditUserModal(false);
      setEditingUser(null);
      fetchDashboardData();
      alert('User updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating user');
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.fullName} • {user?.collegeName ? `${user.collegeName}` : ''}
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
                  setActiveTab('overview');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'overview'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <LayoutDashboard className="inline-block mr-2 h-4 w-4" />
                Overview
              </button>
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
                Jobs
              </button>
              <button
                onClick={() => {
                  setActiveTab('moderators');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'moderators'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <UserCog className="inline-block mr-2 h-4 w-4" />
                Moderators
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
                <GraduationCap className="inline-block mr-2 h-4 w-4" />
                Students
              </button>
              <button
                onClick={() => {
                  setActiveTab('inviteStudents');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'inviteStudents'
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Mail className="inline-block mr-2 h-4 w-4" />
                Invite Students
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
              <div className="text-2xl font-bold">{stats.jobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Moderators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.moderators}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow hidden lg:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {['overview', 'jobs', 'moderators', 'students', 'inviteStudents'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab === 'inviteStudents' ? 'Invite Students' : tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Placement Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Companies Posted</CardTitle>
                      <CardDescription>Unique companies with active jobs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-indigo-600">{dashboardMetrics.totalCompaniesPosted}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Students Placed</CardTitle>
                      <CardDescription>Total students with accepted offers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{dashboardMetrics.totalStudentsPlaced}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Department-wise Placement */}
                {dashboardMetrics.deptWisePlacement.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Department-wise Placement</CardTitle>
                      <CardDescription>Placement statistics by department</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4 font-semibold">Department</th>
                              <th className="text-right py-2 px-4 font-semibold">Placed Students</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardMetrics.deptWisePlacement.map((dept, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-4">{dept.dept}</td>
                                <td className="text-right py-2 px-4">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    {dept.placedCount}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Company-wise Placement */}
                {dashboardMetrics.companyWisePlacement.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Company-wise Placement</CardTitle>
                      <CardDescription>Students placed per company</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4 font-semibold">Company</th>
                              <th className="text-right py-2 px-4 font-semibold">Placed Students</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardMetrics.companyWisePlacement.map((company, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-4 font-medium">{company.companyName}</td>
                                <td className="text-right py-2 px-4">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {company.placedCount}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Jobs Summary with Eligibility */}
                {dashboardMetrics.jobsSummary.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Jobs Summary</CardTitle>
                      <CardDescription>Eligibility and application statistics per job</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2 font-semibold">Company</th>
                              <th className="text-left py-2 px-2 font-semibold">Role</th>
                              <th className="text-center py-2 px-2 font-semibold">Eligible</th>
                              <th className="text-center py-2 px-2 font-semibold">Not Eligible</th>
                              <th className="text-center py-2 px-2 font-semibold">Applied</th>
                              <th className="text-center py-2 px-2 font-semibold">Not Applied</th>
                              <th className="text-center py-2 px-2 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardMetrics.jobsSummary.map((job, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-2 font-medium">{job.companyName}</td>
                                <td className="py-2 px-2">{job.title}</td>
                                <td className="text-center py-2 px-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {job.eligibleCount}
                                  </span>
                                </td>
                                <td className="text-center py-2 px-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    {job.notEligibleCount}
                                  </span>
                                </td>
                                <td className="text-center py-2 px-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {job.appliedCount}
                                  </span>
                                </td>
                                <td className="text-center py-2 px-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    {job.notAppliedCount}
                                  </span>
                                </td>
                                <td className="text-center py-2 px-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const fullJob = jobs.find(j => (j._id || j.id) === job.jobId);
                                      if (fullJob) {
                                        handleEditJob(fullJob);
                                      } else {
                                        setActiveTab('jobs');
                                      }
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="Edit Job"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button onClick={() => navigate('/create-job')} className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Create New Job
                      </Button>
                      <Button onClick={() => setActiveTab('moderators')} variant="outline" className="w-full">
                        <Users className="mr-2 h-4 w-4" /> Manage Moderators
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Jobs</h3>
                  <Button onClick={() => navigate('/create-job')}>
                    <Plus className="mr-2 h-4 w-4" /> Create Job
                  </Button>
                </div>
                <div className="space-y-4">
                  {jobs.map((job) => {
                    // Calculate eligible students based on job requirements
                    const eligibleStudents = students.filter(student => {
                      // Add eligibility logic here based on requirements
                      return student.isApproved && student.isActive;
                    });
                    // Count applications for this job
                    const appliedStudents = applications.filter(app =>
                      (app.jobId === job._id || app.jobId === job.id || app.job?._id === job._id || app.job?._id === job.id)
                    ).length;
                    const notApplied = eligibleStudents.length - appliedStudents;

                    return (
                      <Card key={job._id || job.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle>{job.company || job.companyName}</CardTitle>
                              <CardDescription>
                                {job.location} • {job.title || job.jobCategory}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={job.status || 'active'}
                                onChange={(e) => handleChangeJobStatus(job._id || job.id, e.target.value)}
                                className="px-2 py-1 text-sm border rounded bg-white cursor-pointer"
                                title="Change job status"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="closed">Closed</option>
                                <option value="draft">Draft</option>
                              </select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditJob(job)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteJob(job._id || job.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-600">
                                {job.jobType && <span className="capitalize">{job.jobType}</span>}
                                {job.salary && <span> • {job.salary}</span>}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Status:
                                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${job.status === 'active' ? 'bg-green-100 text-green-800' :
                                  job.status === 'closed' ? 'bg-red-100 text-red-800' :
                                    job.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                  }`}>
                                  {job.status}
                                </span>
                              </p>
                              {job.deadline && (
                                <p className="text-sm text-gray-500">
                                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            {/* Application Statistics */}
                            <div className="pt-3 border-t">
                              <h4 className="text-sm font-semibold mb-2">Student Statistics</h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-green-50 p-3 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-2xl font-bold text-green-700">{eligibleStudents.length}</span>
                                  </div>
                                  <p className="text-xs text-green-600 mt-1">Eligible</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                    <span className="text-2xl font-bold text-blue-700">{appliedStudents}</span>
                                  </div>
                                  <p className="text-xs text-blue-600 mt-1">Applied</p>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <XCircle className="h-5 w-5 text-orange-600" />
                                    <span className="text-2xl font-bold text-orange-700">{notApplied}</span>
                                  </div>
                                  <p className="text-xs text-orange-600 mt-1">Not Applied</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {jobs.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No jobs posted yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'moderators' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Moderators</h3>
                  <Button
                    onClick={() => {
                      setUserType('moderator');
                      setShowAddUserModal(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Moderator
                  </Button>
                </div>
                <div className="space-y-4">
                  {moderators.map((moderator) => (
                    <Card key={moderator._id || moderator.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-semibold">{moderator.fullName}</h4>
                            <p className="text-sm text-gray-600">{moderator.email}</p>
                            <p className="text-sm text-gray-500">{moderator.department}</p>
                            <div className="flex gap-3 mt-2">
                              <span
                                className={`text-xs px-2 py-1 rounded ${moderator.isApproved
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                                  }`}
                              >
                                {moderator.isApproved ? '✓ Approved' : '⏳ Pending Approval'}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${moderator.isActive
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                {moderator.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!moderator.isApproved && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveUser(moderator._id || moderator.id, true)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                            )}
                            {moderator.isApproved && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveUser(moderator._id || moderator.id, false)}
                              >
                                Revoke
                              </Button>
                            )}
                            <Button
                              variant={moderator.isActive ? 'outline' : 'default'}
                              size="sm"
                              onClick={() => handleToggleUserStatus(moderator._id || moderator.id, moderator.isActive)}
                            >
                              {moderator.isActive ? (
                                <>
                                  <UserX className="h-4 w-4 mr-1" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-1" /> Activate
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUserClick(moderator)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(moderator._id || moderator.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {moderators.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No moderators found</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Students</h3>
                    <p className="text-sm text-gray-600">Total: {students.length} students</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowBulkUploadModal(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Bulk Upload
                    </Button>
                    <Button
                      onClick={() => {
                        setUserType('student');
                        setShowAddUserModal(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Student
                    </Button>
                  </div>
                </div>

                {/* Department-wise Student Count */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const deptCounts = students.reduce((acc, student) => {
                      const dept = student.department || 'No Department';
                      acc[dept] = (acc[dept] || 0) + 1;
                      return acc;
                    }, {});
                    return Object.entries(deptCounts).map(([dept, count]) => (
                      <Card key={dept} className="bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardContent className="pt-4 pb-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-indigo-600">{count}</p>
                            <p className="text-xs text-gray-600 mt-1">{dept}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ));
                  })()}
                </div>

                {/* Students grouped by department */}
                <div className="space-y-6">
                  {(() => {
                    const groupedStudents = students.reduce((acc, student) => {
                      const dept = student.department || 'No Department';
                      if (!acc[dept]) acc[dept] = [];
                      acc[dept].push(student);
                      return acc;
                    }, {});

                    return Object.entries(groupedStudents)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dept, deptStudents]) => (
                        <div key={dept}>
                          <h4 className="text-md font-semibold mb-3 text-gray-700 flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-indigo-600" />
                            {dept} ({deptStudents.length})
                          </h4>
                          <div className="space-y-3">
                            {deptStudents.map((student) => (
                              <Card key={student._id || student.id}>
                                <CardContent className="pt-4 pb-4">
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <h5 className="font-semibold">{student.fullName}</h5>
                                      <p className="text-sm text-gray-600">{student.email}</p>
                                      <p className="text-xs text-gray-500 mt-1">@{student.username}</p>
                                      <div className="flex gap-3 mt-2">
                                        <span
                                          className={`text-xs px-2 py-1 rounded ${student.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                          {student.status === 'active' ? '✓ Active' : '✗ Inactive'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditUserClick(student)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant={student.status === 'active' ? 'outline' : 'default'}
                                        size="sm"
                                        onClick={() => handleToggleUserStatus(student._id || student.id, student.status === 'active')}
                                      >
                                        {student.status === 'active' ? (
                                          <>
                                            <UserX className="h-4 w-4 mr-1" /> Block
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck className="h-4 w-4 mr-1" /> Unblock
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteUser(student._id || student.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ));
                  })()}
                </div>

                {students.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No students found</p>
                )}
              </div>
            )}

            {/* Invite Students Tab */}
            {activeTab === 'inviteStudents' && (
              <div>
                <InviteStudents />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                Add {userType.charAt(0).toUpperCase() + userType.slice(1)}
              </CardTitle>
              <CardDescription>
                Create a new {userType} account for your college
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newUserForm.fullName}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUserForm.username}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, username: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, password: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    value={newUserForm.department}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, department: e.target.value })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science Engineering (CSE)</option>
                    <option value="ECE">Electronics and Communication Engineering (ECE)</option>
                    <option value="EEE">Electrical and Electronics Engineering (EEE)</option>
                    <option value="MECH">Mechanical Engineering (MECH)</option>
                    <option value="CIVIL">Civil Engineering (CIVIL)</option>
                    <option value="IT">Information Technology (IT)</option>
                    <option value="ISE">Information Science Engineering (ISE)</option>
                    <option value="AIML">Artificial Intelligence and Machine Learning (AIML)</option>
                    <option value="AIML_DS">Artificial Intelligence and Data Science (AIML_DS)</option>
                    <option value="DS">Data Science (DS)</option>
                    <option value="MBA">Master of Business Administration (MBA)</option>
                    <option value="MCA">Master of Computer Applications (MCA)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddUserModal(false);
                      setNewUserForm({
                        username: '',
                        email: '',
                        fullName: '',
                        password: '',
                        department: '',
                      });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add {userType.charAt(0).toUpperCase() + userType.slice(1)}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                Edit {editingUser.role === 'moderator' ? 'Moderator' : 'Student'}
              </CardTitle>
              <CardDescription>
                Update user information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <Label htmlFor="edit-fullName">Full Name</Label>
                  <Input
                    id="edit-fullName"
                    value={editingUser.fullName}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    value={editingUser.username}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, username: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-department">Department</Label>
                  <select
                    id="edit-department"
                    value={editingUser.department}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, department: e.target.value })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science Engineering (CSE)</option>
                    <option value="ECE">Electronics and Communication Engineering (ECE)</option>
                    <option value="EEE">Electrical and Electronics Engineering (EEE)</option>
                    <option value="MECH">Mechanical Engineering (MECH)</option>
                    <option value="CIVIL">Civil Engineering (CIVIL)</option>
                    <option value="IT">Information Technology (IT)</option>
                    <option value="ISE">Information Science Engineering (ISE)</option>
                    <option value="AIML">Artificial Intelligence and Machine Learning (AIML)</option>
                    <option value="AIML_DS">Artificial Intelligence and Data Science (AIML_DS)</option>
                    <option value="DS">Data Science (DS)</option>
                    <option value="MBA">Master of Business Administration (MBA)</option>
                    <option value="MCA">Master of Computer Applications (MCA)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditUserModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Update User
                  </Button>
                </div>
              </form>
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
                      value={editingJob.company}
                      onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
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
                    value={editingJob.deadline}
                    onChange={(e) => setEditingJob({ ...editingJob, deadline: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Job Description</Label>
                  <textarea
                    id="edit-description"
                    value={editingJob.description}
                    onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-requirements">Requirements (Optional)</Label>
                  <textarea
                    id="edit-requirements"
                    value={editingJob.requirements}
                    onChange={(e) => setEditingJob({ ...editingJob, requirements: e.target.value })}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="e.g., Minimum CGPA 7.0, Java proficiency"
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

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Bulk Upload Students</CardTitle>
              <CardDescription>
                Upload multiple students at once using CSV format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>CSV Data</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <textarea
                value={bulkUploadData}
                onChange={(e) => setBulkUploadData(e.target.value)}
                placeholder="username,email,fullName,password,department&#10;johndoe,john@example.com,John Doe,password123,CSE&#10;janedoe,jane@example.com,Jane Doe,password456,ECE"
                className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                disabled={bulkUploading}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">CSV Format Instructions:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• First line must be: <code className="bg-blue-100 px-1 rounded">username,email,fullName,password,department</code></li>
                  <li>• Each subsequent line represents one student</li>
                  <li>• All fields are required (username, email, fullName, password, department)</li>
                  <li>• <strong>Username:</strong> Only letters, numbers, dots, hyphens, underscores (no spaces)</li>
                  <li>• <strong>Email:</strong> Must be valid email format</li>
                  <li>• <strong>Password:</strong> Minimum 6 characters</li>
                  <li>• <strong>Department codes:</strong> CSE, ECE, EEE, MECH, CIVIL, IT, ISE, AIML, AIML_DS, DS, MBA, MCA</li>
                  <li>• Use quotes for fields with commas: <code className="bg-blue-100 px-1 rounded">"Doe, John"</code></li>
                  <li>• Example: <code className="bg-blue-100 px-1 rounded">johndoe,john@example.com,John Doe,pass123,CSE</code></li>
                </ul>
              </div>

              {bulkUploading && uploadProgress.total > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-purple-900 mb-2">Upload Progress:</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-purple-900">
                      {uploadProgress.current} / {uploadProgress.total}
                    </span>
                  </div>
                </div>
              )}

              {bulkUploadResults && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3 flex items-center justify-between">
                    <span>Upload Results</span>
                    {bulkUploadResults.successful > 0 && (
                      <span className="text-sm text-green-600">✓ {bulkUploadResults.successful} students added successfully</span>
                    )}
                  </h4>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="text-3xl font-bold text-green-600">{bulkUploadResults.successful}</div>
                      <div className="text-xs text-gray-600 font-medium">Successful</div>
                    </div>
                    <div className="text-center bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="text-3xl font-bold text-red-600">{bulkUploadResults.failed}</div>
                      <div className="text-xs text-gray-600 font-medium">Failed</div>
                    </div>
                    <div className="text-center bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="text-3xl font-bold text-yellow-600">{bulkUploadResults.skipped}</div>
                      <div className="text-xs text-gray-600 font-medium">Skipped</div>
                    </div>
                  </div>

                  {bulkUploadResults.errors.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-semibold text-red-700">Errors and Warnings ({bulkUploadResults.errors.length}):</h5>
                        <button
                          onClick={() => {
                            const errorText = bulkUploadResults.errors.join('\n');
                            navigator.clipboard.writeText(errorText);
                            alert('Errors copied to clipboard');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Copy All Errors
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto bg-white border rounded p-3">
                        {bulkUploadResults.errors.map((error, idx) => (
                          <div key={idx} className="text-xs mb-1.5 flex items-start">
                            <span className="text-red-500 mr-2 font-bold">⚠</span>
                            <span className="text-gray-700 flex-1">{error}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-2 italic">
                        💡 Tip: Fix the errors in your CSV and upload again. Successfully added students won't be duplicated.
                      </p>
                    </div>
                  )}

                  {bulkUploadResults.failed === 0 && bulkUploadResults.skipped === 0 && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded p-3 text-center">
                      <span className="text-green-700 font-semibold">✓ All students uploaded successfully!</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setBulkUploadData('');
                    setBulkUploadResults(null);
                  }}
                  className="flex-1"
                  disabled={bulkUploading}
                >
                  Close
                </Button>
                <Button
                  onClick={handleBulkUpload}
                  disabled={bulkUploading || !bulkUploadData.trim()}
                  className="flex-1"
                >
                  {bulkUploading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Students
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
