import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Plus, Trash2, Save, Briefcase } from 'lucide-react';

export default function InternshipForm({ internships = [], onUpdate }) {
  const [internshipList, setInternshipList] = useState(internships);
  const [isAdding, setIsAdding] = useState(false);
  const [newInternship, setNewInternship] = useState({
    company: '',
    role: '',
    duration: '',
    startDate: '',
    endDate: '',
    description: '',
    technologies: ''
  });

  useEffect(() => {
    setInternshipList(internships);
  }, [internships]);

  const handleAddNew = () => {
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewInternship({
      company: '',
      role: '',
      duration: '',
      startDate: '',
      endDate: '',
      description: '',
      technologies: ''
    });
  };

  const handleSaveNew = async () => {
    if (!newInternship.company || !newInternship.role) {
      alert('Please fill in company and role');
      return;
    }

    const updated = [...internshipList, { ...newInternship, id: Date.now() }];
    setInternshipList(updated);
    
    if (onUpdate) {
      await onUpdate(updated);
    }
    
    handleCancel();
    alert('Internship added successfully!');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this internship?')) {
      const updated = internshipList.filter(item => item.id !== id);
      setInternshipList(updated);
      
      if (onUpdate) {
        await onUpdate(updated);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewInternship(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Internship Experience</CardTitle>
            <CardDescription>Add and manage your internship details</CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={handleAddNew} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Internship
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <Briefcase className="inline-block mr-2 h-4 w-4" />
            You can add, edit, and delete your internship experiences.
          </p>
        </div>

        {/* Existing Internships */}
        {internshipList.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Internships</h3>
            {internshipList.map((internship) => (
              <Card key={internship.id} className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{internship.role}</h4>
                      <p className="text-gray-600">{internship.company}</p>
                      <p className="text-sm text-gray-500">
                        {internship.startDate} - {internship.endDate} ({internship.duration})
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(internship.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {internship.description && (
                    <p className="text-sm text-gray-700 mb-2">{internship.description}</p>
                  )}
                  {internship.technologies && (
                    <p className="text-sm text-gray-600">
                      <strong>Technologies:</strong> {internship.technologies}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add New Internship Form */}
        {isAdding && (
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Add New Internship</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <Input
                      id="company"
                      name="company"
                      value={newInternship.company}
                      onChange={handleChange}
                      placeholder="Enter company name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role/Position *</Label>
                    <Input
                      id="role"
                      name="role"
                      value={newInternship.role}
                      onChange={handleChange}
                      placeholder="e.g., Software Development Intern"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={newInternship.startDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={newInternship.endDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      name="duration"
                      value={newInternship.duration}
                      onChange={handleChange}
                      placeholder="e.g., 3 months"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technologies">Technologies Used</Label>
                    <Input
                      id="technologies"
                      name="technologies"
                      value={newInternship.technologies}
                      onChange={handleChange}
                      placeholder="e.g., React, Node.js, MongoDB"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={newInternship.description}
                    onChange={handleChange}
                    placeholder="Describe your responsibilities and achievements"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveNew} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Internship
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAdding && internshipList.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No internship experience added yet.</p>
            <p className="text-sm">Click "Add Internship" to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
