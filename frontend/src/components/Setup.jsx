import React, { useState, useEffect } from 'react';
import { collegeAPI, authAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Building2, Plus, Check, Trash2 } from 'lucide-react';

export default function Setup() {
  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState([]);
  const [collegeForm, setCollegeForm] = useState({
    name: '',
    code: '',
    location: '',
  });
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    collegeId: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await collegeAPI.getAll();
      setColleges(response.data);
    } catch (err) {
      console.error('Error fetching colleges:', err);
    }
  };

  const handleAddCollege = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await collegeAPI.create(collegeForm);
      setMessage('College added successfully!');
      setCollegeForm({ name: '', code: '', location: '' });
      fetchColleges();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error adding college');
    }
  };

  const handleDeleteCollege = async (collegeId) => {
    if (!window.confirm('Are you sure you want to delete this college? This action cannot be undone.')) {
      return;
    }

    setError('');
    setMessage('');
    setDeleting(collegeId);

    try {
      await collegeAPI.delete(collegeId);
      setMessage('College deleted successfully!');
      fetchColleges();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error deleting college';
      setError(errorMsg);
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const userData = {
        ...adminForm,
        role: 'admin',
        department: 'Administration',
      };
      await authAPI.register(userData);
      setMessage('Admin user created successfully! You can now login.');
      setAdminForm({
        username: '',
        email: '',
        fullName: '',
        password: '',
        collegeId: '',
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error creating admin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">System Setup</h1>
          <p className="text-gray-600 mt-2">Configure your placement portal</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300'
                }`}
              >
                {step > 1 ? <Check className="h-5 w-5" /> : '1'}
              </div>
              <span className="ml-2 font-medium">Add Colleges</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300'
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium">Create Admin</span>
            </div>
          </div>
        </div>

        {/* Step 1: Add Colleges */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Your College</CardTitle>
                <CardDescription>Add colleges to your placement portal</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCollege} className="space-y-4">
                  <div>
                    <Label htmlFor="name">College Name</Label>
                    <Input
                      id="name"
                      value={collegeForm.name}
                      onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                      placeholder="e.g., MIT College of Engineering"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">College Code (Unique)</Label>
                    <Input
                      id="code"
                      value={collegeForm.code}
                      onChange={(e) =>
                        setCollegeForm({ ...collegeForm, code: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g., MIT"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={collegeForm.location}
                      onChange={(e) => setCollegeForm({ ...collegeForm, location: e.target.value })}
                      placeholder="e.g., Pune, Maharashtra"
                      required
                    />
                  </div>

                  {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
                  {message && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">{message}</div>
                  )}

                  <Button type="submit" className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add College
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* List of Added Colleges */}
            {colleges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Added Colleges ({colleges.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>}
                  {message && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm mb-4">{message}</div>
                  )}
                  <div className="space-y-2">
                    {colleges.map((college) => (
                      <div
                        key={college.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <div className="font-semibold">{college.name}</div>
                          <div className="text-sm text-gray-600">
                            {college.code} • {college.location}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCollege(college.id)}
                          disabled={deleting === college.id}
                        >
                          {deleting === college.id ? (
                            'Deleting...'
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => setStep(2)} className="w-full mt-4">
                    Continue to Create Admin →
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Create Admin User */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Create Admin User</CardTitle>
              <CardDescription>Create the first admin for a college</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <Label htmlFor="collegeId">Select College</Label>
                  <select
                    id="collegeId"
                    value={adminForm.collegeId}
                    onChange={(e) => setAdminForm({ ...adminForm, collegeId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Choose a college</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.id}>
                        {college.name} ({college.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={adminForm.fullName}
                    onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="e.g., admin@college.edu"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={adminForm.username}
                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                    placeholder="e.g., adminmit"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="Enter secure password"
                    required
                  />
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
                {message && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">{message}</div>
                )}

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    ← Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Admin User
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8">
          <a href="/" className="text-indigo-600 hover:underline">
            Skip setup and go to login
          </a>
        </div>
      </div>
    </div>
  );
}
