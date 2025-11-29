import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Lock, Save, Edit2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';

export default function ProfileForm({ studentData, onUpdate, isModeratorView = false }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canEdit = isModeratorView || !studentData?.isProfileCompleted;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    rollNumber: '',
    department: '',
    year: '',
    semester: '',
    dateOfBirth: '',
    address: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    cgpa: '',
    backlogs: '',
    ...studentData
  });

  useEffect(() => {
    if (studentData) {
      setFormData(prev => ({ ...prev, ...studentData }));
    }
  }, [studentData]);

  const handleChange = (e) => {
    // Prevent changes if student and profile is completed
    if (readOnlyForStudent) {
      e.preventDefault();
      return;
    }
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if student and profile is completed
    if (readOnlyForStudent) {
      alert('Profile is locked. Contact your moderator to make changes.');
      return;
    }
    
    try {
      // Mark profile as completed after first save
      const updatedData = {
        ...formData,
        isProfileCompleted: true
      };
      
      if (onUpdate) {
        await onUpdate(updatedData);
      }
      
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const readOnlyForStudent = isStudent && studentData?.isProfileCompleted && !isModeratorView;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              {readOnlyForStudent 
                ? 'Your profile details (contact moderator for changes)'
                : isStudent && !studentData?.isProfileCompleted
                ? 'Complete your profile (one-time setup)'
                : 'Student profile details'}
            </CardDescription>
          </div>
          {isModeratorView && (
            <Button
              variant={isEditing ? "outline" : "default"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {readOnlyForStudent && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800 flex items-center">
              <Lock className="inline-block mr-2 h-4 w-4" />
              <strong>Note:</strong> Profile information is locked. Contact your department moderator to update personal details, academic records, or contact information.
            </p>
          </div>
        )}

        {!studentData?.isProfileCompleted && isStudent && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>First Time Setup:</strong> Please fill in all your details. After saving, these fields will be locked and can only be edited by moderators.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                className={readOnlyForStudent ? 'bg-gray-100' : ''}
                rows={3}
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Academic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number *</Label>
                <Input
                  id="rollNumber"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Input
                  id="semester"
                  name="semester"
                  type="number"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenthPercentage">10th Percentage *</Label>
                <Input
                  id="tenthPercentage"
                  name="tenthPercentage"
                  type="number"
                  step="0.01"
                  value={formData.tenthPercentage}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twelfthPercentage">12th Percentage *</Label>
                <Input
                  id="twelfthPercentage"
                  name="twelfthPercentage"
                  type="number"
                  step="0.01"
                  value={formData.twelfthPercentage}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cgpa">Current CGPA *</Label>
                <Input
                  id="cgpa"
                  name="cgpa"
                  type="number"
                  step="0.01"
                  value={formData.cgpa}
                  onChange={handleChange}
                  required
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backlogs">Number of Backlogs</Label>
                <Input
                  id="backlogs"
                  name="backlogs"
                  type="number"
                  value={formData.backlogs}
                  onChange={handleChange}
                  disabled={readOnlyForStudent || (!isEditing && isModeratorView)}
                  className={readOnlyForStudent ? 'bg-gray-100' : ''}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {(!readOnlyForStudent && (!isModeratorView || isEditing)) && (
            <Button type="submit" className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {studentData?.isProfileCompleted ? 'Update Profile' : 'Complete Profile'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
