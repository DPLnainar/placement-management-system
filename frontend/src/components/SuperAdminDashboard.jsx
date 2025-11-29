import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Building2, Users, Briefcase, Plus, Edit, Eye, Shield } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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
  const [stats, setStats] = useState({
    totalColleges: 0,
    totalStudents: 0,
    totalJobs: 0,
    totalAdmins: 0
  });
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddCollegeOpen, setIsAddCollegeOpen] = useState(false);
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
  const [formErrors, setFormErrors] = useState({});
  const [createdCredentials, setCreatedCredentials] = useState(null);

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
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
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
                      <span className={`px-2 py-1 rounded text-sm ${
                        college.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                        college.subscriptionStatus === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {college.subscriptionStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
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
    </div>
  );
};

export default SuperAdminDashboard;
