import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Building2, Users, Briefcase, Plus, Edit, Eye, Shield, LogOut, Trash2, Upload, Download, X, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * SUPER ADMIN DASHBOARD
 * 
 * ⚠️ Protected Component - Only accessible by users with 'superadmin' role
 * 
 * Features:
 * - Global statistics (total colleges, students, jobs)
 * - College management table
 * - Add new college with admin
 * - View all colleges with their admins
 */
const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalColleges: 0,
    totalStudents: 0,
    totalJobs: 0,
    totalAdmins: 0
  });
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddCollegeOpen, setIsAddCollegeOpen] = useState(false);
  const [isViewCollegeOpen, setIsViewCollegeOpen] = useState(false);
  const [isEditCollegeOpen, setIsEditCollegeOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [formData, setFormData] = useState({
    collegeName: '',
    collegeAddress: '',
    collegeCode: '',
    subscriptionStatus: 'active',
    adminName: '',
    adminEmail: '',
    adminUsername: '',
    adminPassword: ''
  });
  const [editFormData, setEditFormData] = useState({
    collegeName: '',
    collegeAddress: '',
    collegeCode: '',
    subscriptionStatus: 'active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Bulk upload states
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState('');
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/superadmin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      if (error.response?.status === 403) {
        alert('Access denied. You must be a Super Admin to view this page.');
      }
    }
  };

  // Fetch all colleges
  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/superadmin/colleges`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setColleges(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchColleges();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.collegeName.trim()) errors.collegeName = 'College name is required';
    if (!formData.collegeAddress.trim()) errors.collegeAddress = 'Address is required';
    if (!formData.collegeCode.trim()) errors.collegeCode = 'College code is required';
    if (!formData.adminName.trim()) errors.adminName = 'Admin name is required';
    if (!formData.adminEmail.trim()) errors.adminEmail = 'Admin email is required';
    if (!formData.adminUsername.trim()) errors.adminUsername = 'Admin username is required';
    if (!formData.adminPassword.trim()) errors.adminPassword = 'Admin password is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.adminEmail && !emailRegex.test(formData.adminEmail)) {
      errors.adminEmail = 'Invalid email format';
    }

    // Password validation
    if (formData.adminPassword && formData.adminPassword.length < 6) {
      errors.adminPassword = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create college
  const handleCreateCollege = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/superadmin/colleges`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Show credentials
        setCreatedCredentials(response.data.data.credentials);

        // Refresh data
        fetchDashboardStats();
        fetchColleges();

        // Reset form
        setFormData({
          collegeName: '',
          collegeAddress: '',
          collegeCode: '',
          subscriptionStatus: 'active',
          adminName: '',
          adminEmail: '',
          adminUsername: '',
          adminPassword: ''
        });
      }
    } catch (error) {
      console.error('Error creating college:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Failed to create college. Please try again.');
      }
    }
  };

  // Close dialog and reset credentials
  const handleCloseDialog = () => {
    setIsAddCollegeOpen(false);
    setCreatedCredentials(null);
  };

  // Handle view college details
  const handleViewCollege = (college) => {
    setSelectedCollege(college);
    setIsViewCollegeOpen(true);
  };

  // Handle edit college
  const handleEditCollege = (college) => {
    setSelectedCollege(college);
    setEditFormData({
      collegeName: college.name,
      collegeAddress: college.location,
      collegeCode: college.code,
      subscriptionStatus: college.subscriptionStatus
    });
    setIsEditCollegeOpen(true);
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit edit college form
  const handleUpdateCollege = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/superadmin/colleges/${selectedCollege.id}`,
        editFormData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('College updated successfully!');
        setIsEditCollegeOpen(false);
        fetchDashboardStats();
        fetchColleges();
      }
    } catch (error) {
      console.error('Error updating college:', error);
      alert(error.response?.data?.message || 'Failed to update college. Please try again.');
    }
  };

  // Handle delete college
  const handleDeleteCollege = async (collegeId) => {
    if (!window.confirm('Are you sure you want to delete this college? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/superadmin/colleges/${collegeId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('College deleted successfully!');
        fetchDashboardStats();
        fetchColleges();
      }
    } catch (error) {
      console.error('Error deleting college:', error);
      alert(error.response?.data?.message || 'Failed to delete college. Please try again.');
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setBulkUploadData(text);
    };
    reader.onerror = () => {
      alert('Error reading file');
      setSelectedFileName('');
    };
    reader.readAsText(file);
  };

  // Clear uploaded file
  const handleClearFile = () => {
    setBulkUploadData('');
    setSelectedFileName('');
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = `collegeName,collegeCode,collegeAddress,subscriptionStatus,adminName,adminEmail,adminUsername,adminPassword
Massachusetts Institute of Technology,MIT,"Cambridge, MA",active,John Smith,admin@mit.edu,admin_mit,SecurePass123
Stanford University,STANFORD,"Stanford, CA",active,Jane Doe,admin@stanford.edu,admin_stanford,StanfordAdmin456
Harvard University,HARVARD,"Cambridge, MA",trial,Bob Wilson,admin@harvard.edu,admin_harvard,HarvardPass789`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'college_bulk_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Parse CSV data
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

    const requiredHeaders = ['collegeName', 'collegeCode', 'collegeAddress', 'subscriptionStatus', 'adminName', 'adminEmail', 'adminUsername', 'adminPassword'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const colleges = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = [];
      let current = '';
      let inQuotes = false;

      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));

      if (values.length !== headers.length) {
        throw new Error(`Line ${i + 1}: Expected ${headers.length} columns but found ${values.length}`);
      }

      const college = {};
      headers.forEach((header, index) => {
        college[header] = values[index];
      });

      colleges.push({ ...college, lineNumber: i + 1 });
    }

    return colleges;
  };

  // Validate college data
  const validateCollege = (college) => {
    const errors = [];

    if (!college.collegeName || college.collegeName.trim() === '') {
      errors.push('College name is required');
    }

    if (!college.collegeCode || college.collegeCode.trim() === '') {
      errors.push('College code is required');
    } else if (!/^[A-Z0-9_-]+$/i.test(college.collegeCode)) {
      errors.push('College code should only contain letters, numbers, hyphens, and underscores');
    }

    if (!college.collegeAddress || college.collegeAddress.trim() === '') {
      errors.push('College address is required');
    }

    const validStatuses = ['active', 'trial', 'expired', 'suspended'];
    if (!validStatuses.includes(college.subscriptionStatus?.toLowerCase())) {
      errors.push(`Invalid subscription status. Must be one of: ${validStatuses.join(', ')}`);
    }

    if (!college.adminName || college.adminName.trim() === '') {
      errors.push('Admin name is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!college.adminEmail || !emailRegex.test(college.adminEmail)) {
      errors.push('Valid admin email is required');
    }

    if (!college.adminUsername || college.adminUsername.trim() === '') {
      errors.push('Admin username is required');
    } else if (!/^[a-zA-Z0-9._-]+$/.test(college.adminUsername)) {
      errors.push('Admin username should only contain letters, numbers, dots, hyphens, and underscores (no spaces)');
    }

    if (!college.adminPassword || college.adminPassword.length < 6) {
      errors.push('Admin password must be at least 6 characters');
    }

    return errors;
  };

  // Send bulk upload summary email
  const sendBulkUploadEmail = async (results) => {
    try {
      setIsSendingEmail(true);
      const token = localStorage.getItem('token');

      await axios.post(
        `${API_BASE_URL}/superadmin/send-bulk-upload-email`,
        { results },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✅ Summary email sent to your inbox!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('⚠️ Upload completed but email sending failed. Results are shown below.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    setBulkUploadResults(null);

    try {
      const colleges = parseCSV(bulkUploadData);

      if (colleges.length === 0) {
        alert('No valid college data found in CSV');
        return;
      }

      setIsUploading(true);
      setUploadProgress({ current: 0, total: colleges.length });

      const results = {
        successful: [],
        failed: [],
        total: colleges.length
      };

      const token = localStorage.getItem('token');

      for (let i = 0; i < colleges.length; i++) {
        const college = colleges[i];
        setUploadProgress({ current: i + 1, total: colleges.length });

        const validationErrors = validateCollege(college);

        if (validationErrors.length > 0) {
          results.failed.push({
            line: college.lineNumber,
            collegeName: college.collegeName || 'Unknown',
            errors: validationErrors
          });
          continue;
        }

        try {
          const response = await axios.post(
            `${API_BASE_URL}/superadmin/colleges`,
            {
              collegeName: college.collegeName.trim(),
              collegeCode: college.collegeCode.trim().toUpperCase(),
              collegeAddress: college.collegeAddress.trim(),
              subscriptionStatus: college.subscriptionStatus.toLowerCase(),
              adminName: college.adminName.trim(),
              adminEmail: college.adminEmail.trim().toLowerCase(),
              adminUsername: college.adminUsername.trim(),
              adminPassword: college.adminPassword
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (response.data.success) {
            results.successful.push({
              line: college.lineNumber,
              collegeName: college.collegeName,
              collegeCode: college.collegeCode,
              credentials: response.data.data.credentials
            });
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
          results.failed.push({
            line: college.lineNumber,
            collegeName: college.collegeName,
            errors: [errorMessage]
          });
        }

        if (i < colleges.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setBulkUploadResults(results);

      if (results.successful.length > 0) {
        fetchDashboardStats();
        fetchColleges();
      }

      // Send email summary
      await sendBulkUploadEmail(results);

      if (results.failed.length === 0) {
        setBulkUploadData('');
        setSelectedFileName('');
      }

    } catch (error) {
      console.error('Bulk upload error:', error);
      alert(error.message || 'Failed to process CSV file');
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  // Copy all errors to clipboard
  const copyErrors = () => {
    if (!bulkUploadResults?.failed.length) return;

    const errorText = bulkUploadResults.failed
      .map(item => `Line ${item.line} (${item.collegeName}): ${item.errors.join(', ')}`)
      .join('\n');

    navigator.clipboard.writeText(errorText);
    alert('Errors copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading Super Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.fullName || 'Super Admin'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => logout()} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
        <p className="text-gray-600">Global view across all colleges</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Colleges</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalColleges}</div>
            <p className="text-xs text-muted-foreground">Active institutions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all colleges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">Posted opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">College Admins</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">Active administrators</p>
          </CardContent>
        </Card>
      </div>

      {/* College Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>College Management</CardTitle>
              <CardDescription>Manage all colleges and their administrators</CardDescription>
            </div>
            <div className="flex gap-2">
              {/* Bulk Upload Button */}
              <Button
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                onClick={() => setIsBulkUploadOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>

              {/* Add Single College Button */}
              <Dialog open={isAddCollegeOpen} onOpenChange={setIsAddCollegeOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New College
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New College & Admin</DialogTitle>
                    <DialogDescription>
                      Add a new college and create its administrator account
                    </DialogDescription>
                  </DialogHeader>

                  {createdCredentials ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-green-900 mb-2">
                          ✅ College & Admin Created Successfully!
                        </h3>
                        <div className="bg-white border border-green-300 rounded p-4 mt-3">
                          <p className="font-semibold mb-2">Admin Login Credentials:</p>
                          <div className="space-y-1 font-mono text-sm">
                            <p><span className="font-bold">Username:</span> {createdCredentials.username}</p>
                            <p><span className="font-bold">Password:</span> {createdCredentials.password}</p>
                          </div>
                          <p className="text-red-600 text-sm mt-3">
                            ⚠️ {createdCredentials.message}
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleCloseDialog} className="w-full">
                        Close
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateCollege} className="space-y-4">
                      {/* College Information */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">College Information</h3>

                        <div>
                          <Label htmlFor="collegeName">College Name *</Label>
                          <Input
                            id="collegeName"
                            name="collegeName"
                            value={formData.collegeName}
                            onChange={handleInputChange}
                            placeholder="Massachusetts Institute of Technology"
                          />
                          {formErrors.collegeName && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.collegeName}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="collegeAddress">College Address *</Label>
                          <Input
                            id="collegeAddress"
                            name="collegeAddress"
                            value={formData.collegeAddress}
                            onChange={handleInputChange}
                            placeholder="Cambridge, MA"
                          />
                          {formErrors.collegeAddress && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.collegeAddress}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="collegeCode">College Code *</Label>
                          <Input
                            id="collegeCode"
                            name="collegeCode"
                            value={formData.collegeCode}
                            onChange={handleInputChange}
                            placeholder="MIT"
                          />
                          {formErrors.collegeCode && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.collegeCode}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="subscriptionStatus">Subscription Status</Label>
                          <select
                            id="subscriptionStatus"
                            name="subscriptionStatus"
                            value={formData.subscriptionStatus}
                            onChange={handleInputChange}
                            className="w-full border rounded-md p-2"
                          >
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="expired">Expired</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>

                      {/* Admin Information */}
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-lg">College Admin Details</h3>

                        <div>
                          <Label htmlFor="adminName">Admin Full Name *</Label>
                          <Input
                            id="adminName"
                            name="adminName"
                            value={formData.adminName}
                            onChange={handleInputChange}
                            placeholder="John Smith"
                          />
                          {formErrors.adminName && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.adminName}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="adminEmail">Admin Email *</Label>
                          <Input
                            id="adminEmail"
                            name="adminEmail"
                            type="email"
                            value={formData.adminEmail}
                            onChange={handleInputChange}
                            placeholder="admin@mit.edu"
                          />
                          {formErrors.adminEmail && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.adminEmail}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="adminUsername">Admin Username *</Label>
                          <Input
                            id="adminUsername"
                            name="adminUsername"
                            value={formData.adminUsername}
                            onChange={handleInputChange}
                            placeholder="admin_mit"
                          />
                          {formErrors.adminUsername && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.adminUsername}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="adminPassword">Admin Password *</Label>
                          <Input
                            id="adminPassword"
                            name="adminPassword"
                            type="password"
                            value={formData.adminPassword}
                            onChange={handleInputChange}
                            placeholder="Minimum 6 characters"
                          />
                          {formErrors.adminPassword && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.adminPassword}</p>
                          )}
                        </div>
                      </div>

                      <Button type="submit" className="w-full">
                        Create College & Admin
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">College Name</th>
                  <th className="text-left p-4 font-medium">Code</th>
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">Admin Email</th>
                  <th className="text-left p-4 font-medium">Students</th>
                  <th className="text-left p-4 font-medium">Jobs</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {colleges.map((college) => (
                  <tr key={college.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm font-mono">{college.id.substring(0, 8)}...</td>
                    <td className="p-4 font-medium">{college.name}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {college.code}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{college.location}</td>
                    <td className="p-4 text-sm">{college.admin?.email || 'N/A'}</td>
                    <td className="p-4 text-center">{college.stats.students}</td>
                    <td className="p-4 text-center">{college.stats.jobs}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${college.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                          college.subscriptionStatus === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {college.subscriptionStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCollege(college)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCollege(college)}
                          title="Edit College"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCollege(college.id)}
                          title="Delete College"
                          className="text-red-600 hover:text-red-700 hover:border-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {colleges.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No colleges found. Click "Add New College" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View College Dialog */}
      <Dialog open={isViewCollegeOpen} onOpenChange={setIsViewCollegeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>College Details</DialogTitle>
            <DialogDescription>
              View detailed information about this college
            </DialogDescription>
          </DialogHeader>

          {selectedCollege && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">College Name</Label>
                  <p className="text-lg font-medium">{selectedCollege.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">College Code</Label>
                  <p className="text-lg font-mono">{selectedCollege.code}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Location</Label>
                  <p className="text-lg">{selectedCollege.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Subscription Status</Label>
                  <p>
                    <span className={`px-3 py-1 rounded text-sm ${selectedCollege.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                        selectedCollege.subscriptionStatus === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {selectedCollege.subscriptionStatus}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold text-gray-600 mb-2 block">Administrator</Label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedCollege.admin?.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedCollege.admin?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Username</p>
                      <p className="font-medium">{selectedCollege.admin?.username || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-medium">
                        <span className={`px-2 py-1 rounded text-sm ${selectedCollege.admin?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {selectedCollege.admin?.status || 'N/A'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold text-gray-600 mb-2 block">Statistics</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedCollege.stats.students}</p>
                    <p className="text-sm text-gray-600">Students</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedCollege.stats.jobs}</p>
                    <p className="text-sm text-gray-600">Jobs</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedCollege.stats.moderators || 0}</p>
                    <p className="text-sm text-gray-600">Moderators</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsViewCollegeOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewCollegeOpen(false);
                  handleEditCollege(selectedCollege);
                }}>
                  Edit College
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit College Dialog */}
      <Dialog open={isEditCollegeOpen} onOpenChange={setIsEditCollegeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit College</DialogTitle>
            <DialogDescription>
              Update college information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCollege} className="space-y-4">
            <div>
              <Label htmlFor="editCollegeName">College Name *</Label>
              <Input
                id="editCollegeName"
                name="collegeName"
                value={editFormData.collegeName}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="editCollegeAddress">College Address *</Label>
              <Input
                id="editCollegeAddress"
                name="collegeAddress"
                value={editFormData.collegeAddress}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="editCollegeCode">College Code *</Label>
              <Input
                id="editCollegeCode"
                name="collegeCode"
                value={editFormData.collegeCode}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="editSubscriptionStatus">Subscription Status *</Label>
              <select
                id="editSubscriptionStatus"
                name="subscriptionStatus"
                value={editFormData.subscriptionStatus}
                onChange={handleEditInputChange}
                className="w-full border rounded-md p-2"
                required
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditCollegeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update College
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload Colleges</DialogTitle>
            <DialogDescription>
              Upload multiple colleges at once using CSV format. A summary email will be sent to you after upload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                📋 CSV Format Instructions
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li><strong>Required columns:</strong> collegeName, collegeCode, collegeAddress, subscriptionStatus, adminName, adminEmail, adminUsername, adminPassword</li>
                <li><strong>Subscription Status:</strong> active, trial, expired, or suspended</li>
                <li><strong>College Code:</strong> Uppercase letters, numbers, hyphens, underscores only</li>
                <li><strong>Admin Username:</strong> Letters, numbers, dots, hyphens, underscores (no spaces)</li>
                <li><strong>Password:</strong> Minimum 6 characters</li>
                <li>For addresses with commas, wrap in quotes (e.g., "Cambridge, MA")</li>
                <li className="text-purple-700 font-semibold mt-2">✉️ A summary email with all credentials will be sent to your inbox!</li>
              </ul>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template CSV
              </Button>
            </div>

            {/* File Upload Section */}
            <div className="space-y-3">
              <Label>Upload CSV File or Paste Data Below:</Label>

              <div className="flex gap-2">
                <input
                  type="file"
                  id="csvFileInput"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('csvFileInput').click()}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose CSV File
                </Button>

                {selectedFileName && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearFile}
                    disabled={isUploading}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>

              {selectedFileName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-900 font-medium">
                    File selected: {selectedFileName}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-sm text-gray-500 font-medium">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div>
                <Label htmlFor="bulkCsvData">Paste CSV Data:</Label>
                <textarea
                  id="bulkCsvData"
                  value={bulkUploadData}
                  onChange={(e) => setBulkUploadData(e.target.value)}
                  placeholder={`collegeName,collegeCode,collegeAddress,subscriptionStatus,adminName,adminEmail,adminUsername,adminPassword
MIT,MIT,"Cambridge, MA",active,John Smith,admin@mit.edu,admin_mit,SecurePass123`}
                  className="w-full h-40 p-3 border rounded-md font-mono text-sm"
                  disabled={isUploading}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {bulkUploadData ? `${bulkUploadData.split('\n').length} lines` : 'No data entered'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    {isSendingEmail ? 'Sending email summary...' : `Uploading colleges... ${uploadProgress.current} / ${uploadProgress.total}`}
                  </span>
                  <span className="text-sm font-medium text-blue-900">
                    {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Results */}
            {bulkUploadResults && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {bulkUploadResults.successful.length}
                    </div>
                    <div className="text-sm text-green-600">Successful</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-700">
                      {bulkUploadResults.failed.length}
                    </div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {bulkUploadResults.total}
                    </div>
                    <div className="text-sm text-blue-600">Total</div>
                  </div>
                </div>

                {/* Email sent notification */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
                  <Mail className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm text-purple-900">
                    <strong>Email Summary Sent!</strong> Check your inbox for detailed results including all admin credentials.
                  </div>
                </div>

                {bulkUploadResults.successful.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900 mb-2">
                          ✅ {bulkUploadResults.successful.length} college(s) created successfully!
                        </h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {bulkUploadResults.successful.slice(0, 5).map((item, index) => (
                            <div key={index} className="bg-white border border-green-300 rounded p-2 text-sm">
                              <div className="font-medium text-green-900">
                                {item.collegeName} ({item.collegeCode})
                              </div>
                            </div>
                          ))}
                          {bulkUploadResults.successful.length > 5 && (
                            <p className="text-sm text-green-700 italic">
                              + {bulkUploadResults.successful.length - 5} more (see email for full list)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {bulkUploadResults.failed.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <h4 className="font-semibold text-red-900">
                          ⚠️ {bulkUploadResults.failed.length} college(s) failed to upload
                        </h4>
                      </div>
                      <Button
                        onClick={copyErrors}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300"
                      >
                        Copy All Errors
                      </Button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 mt-3">
                      {bulkUploadResults.failed.map((item, index) => (
                        <div key={index} className="bg-white border border-red-300 rounded p-3 text-sm">
                          <div className="font-medium text-red-900 mb-1">
                            Line {item.line}: {item.collegeName}
                          </div>
                          <ul className="list-disc list-inside text-red-700 space-y-0.5">
                            {item.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-red-700 mt-3">
                      💡 <strong>Tip:</strong> Fix the errors and upload again. Successfully uploaded colleges won't be duplicated.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkUploadOpen(false);
                  setBulkUploadData('');
                  setBulkUploadResults(null);
                  setSelectedFileName('');
                }}
                disabled={isUploading}
              >
                {bulkUploadResults ? 'Close' : 'Cancel'}
              </Button>
              {!bulkUploadResults && (
                <Button
                  onClick={handleBulkUpload}
                  disabled={!bulkUploadData.trim() || isUploading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isUploading ? 'Uploading...' : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Colleges
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
