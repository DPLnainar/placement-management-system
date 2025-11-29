import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft } from 'lucide-react';

export default function CreateJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    location: '',
    jobCategory: '',
    jobType: 'full-time',
    ctc: '',
    jobDescription: '',
    termsConditions: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    cgpa: '',
    deadline: '',
    skills: {
      wirelessCommunication: false,
      fullstackDeveloper: false,
      embedded: false,
      vlsi: false,
      cybersecurity: false,
      cloud: false,
      networking: false,
      blockchain: false,
      others: false,
    },
    otherSkill: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSkillChange = (skill) => {
    setFormData({
      ...formData,
      skills: {
        ...formData.skills,
        [skill]: !formData.skills[skill],
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map frontend field names to backend expected names
      const jobData = {
        title: formData.jobCategory,
        company: formData.companyName,
        description: formData.jobDescription,
        salary: formData.ctc,
        location: formData.location,
        jobType: formData.jobType,
        deadline: formData.deadline,
        // Additional fields (can be stored in description or ignored for now)
        requirements: {
          tenthPercentage: parseFloat(formData.tenthPercentage) || 0,
          twelfthPercentage: parseFloat(formData.twelfthPercentage) || 0,
          cgpa: parseFloat(formData.cgpa) || 0,
          skills: formData.skills
        }
      };

      await jobAPI.create(jobData);
      alert('Job posted successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.detail || 'Error creating job');
      console.error('Job creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const skillsList = [
    { id: 'wirelessCommunication', label: 'Wireless Communication' },
    { id: 'fullstackDeveloper', label: 'Fullstack Developer' },
    { id: 'embedded', label: 'Embedded Systems' },
    { id: 'vlsi', label: 'VLSI' },
    { id: 'cybersecurity', label: 'Cybersecurity' },
    { id: 'cloud', label: 'Cloud Computing' },
    { id: 'networking', label: 'Networking' },
    { id: 'blockchain', label: 'Blockchain' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Job Posting</CardTitle>
            <CardDescription>Fill in the details for the new job opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Job Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobCategory">Job Title/Category</Label>
                    <Input
                      id="jobCategory"
                      name="jobCategory"
                      placeholder="e.g., Software Engineer, Data Analyst"
                      value={formData.jobCategory}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobType">Job Type</Label>
                    <select
                      id="jobType"
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="internship">Internship</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ctc">CTC/Salary Package</Label>
                    <Input
                      id="ctc"
                      name="ctc"
                      placeholder="e.g., 5-7 LPA or $80,000/year"
                      value={formData.ctc}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Application Deadline</Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">Job will automatically become inactive after this date</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    name="jobDescription"
                    rows={4}
                    value={formData.jobDescription}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="termsConditions">Terms & Conditions</Label>
                  <Textarea
                    id="termsConditions"
                    name="termsConditions"
                    rows={3}
                    value={formData.termsConditions}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Eligibility Criteria */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Eligibility Criteria</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tenthPercentage">10th Percentage</Label>
                    <Input
                      id="tenthPercentage"
                      name="tenthPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.tenthPercentage}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="twelfthPercentage">12th Percentage</Label>
                    <Input
                      id="twelfthPercentage"
                      name="twelfthPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.twelfthPercentage}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cgpa">Minimum CGPA</Label>
                    <Input
                      id="cgpa"
                      name="cgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.cgpa}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Required Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillsList.map((skill) => (
                    <div key={skill.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={skill.id}
                        checked={formData.skills[skill.id]}
                        onCheckedChange={() => handleSkillChange(skill.id)}
                      />
                      <Label htmlFor={skill.id} className="cursor-pointer">
                        {skill.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <div>
                  <Label htmlFor="otherSkill">Other Skills (Optional)</Label>
                  <Input
                    id="otherSkill"
                    name="otherSkill"
                    placeholder="Specify other required skills"
                    value={formData.otherSkill}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Job Posting'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
