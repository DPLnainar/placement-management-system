import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft } from 'lucide-react';

export default function EditJob() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(true);
  const [formData, setFormData] = useState({
    companyName: '',
    location: '',
    jobCategory: '',
    jobDescription: '',
    termsConditions: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    cgpa: '',
    deadline: '',
    status: 'active',
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

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await jobAPI.getById(jobId);
      const job = response.data;
      
      // Format deadline for datetime-local input
      let deadlineValue = '';
      if (job.deadline) {
        const date = new Date(job.deadline);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        deadlineValue = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      setFormData({
        companyName: job.companyName || '',
        location: job.location || '',
        jobCategory: job.jobCategory || '',
        jobDescription: job.jobDescription || '',
        termsConditions: job.termsConditions || '',
        tenthPercentage: job.tenthPercentage?.toString() || '',
        twelfthPercentage: job.twelfthPercentage?.toString() || '',
        cgpa: job.cgpa?.toString() || '',
        deadline: deadlineValue,
        status: job.status || 'active',
        skills: job.skills || {
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
        otherSkill: job.otherSkill || '',
      });
    } catch (error) {
      alert('Error loading job: ' + (error.response?.data?.detail || error.message));
      navigate('/dashboard');
    } finally {
      setLoadingJob(false);
    }
  };

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
      const jobData = {
        companyName: formData.companyName,
        location: formData.location,
        jobCategory: formData.jobCategory,
        jobDescription: formData.jobDescription,
        termsConditions: formData.termsConditions,
        tenthPercentage: parseFloat(formData.tenthPercentage),
        twelfthPercentage: parseFloat(formData.twelfthPercentage),
        cgpa: parseFloat(formData.cgpa),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        status: formData.status,
        skills: formData.skills,
        otherSkill: formData.otherSkill,
      };

      await jobAPI.update(jobId, jobData);
      alert('Job updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error updating job');
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

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading job details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Job Posting</CardTitle>
            <CardDescription>Update the details for this job opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobCategory">Job Category *</Label>
                  <Input
                    id="jobCategory"
                    name="jobCategory"
                    value={formData.jobCategory}
                    onChange={handleChange}
                    placeholder="e.g., Software Developer, Data Analyst"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Application Deadline *</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-gray-500">Job will automatically become inactive after this date</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termsConditions">Terms & Conditions *</Label>
                <Textarea
                  id="termsConditions"
                  name="termsConditions"
                  value={formData.termsConditions}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tenthPercentage">10th Percentage *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="twelfthPercentage">12th Percentage *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="cgpa">CGPA *</Label>
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

              <div className="space-y-4">
                <Label>Required Skills *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillsList.map((skill) => (
                    <div key={skill.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={skill.id}
                        checked={formData.skills[skill.id]}
                        onCheckedChange={() => handleSkillChange(skill.id)}
                      />
                      <label htmlFor={skill.id} className="text-sm font-medium leading-none cursor-pointer">
                        {skill.label}
                      </label>
                    </div>
                  ))}
                </div>

                {formData.skills.others && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="otherSkill">Specify Other Skill</Label>
                    <Input
                      id="otherSkill"
                      name="otherSkill"
                      value={formData.otherSkill}
                      onChange={handleChange}
                      placeholder="Enter other required skill"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Job Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Updating...' : 'Update Job'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
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
