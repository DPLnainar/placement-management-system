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
    eligibilityType: 'common', // New: 'common' or 'department-wise'
    commonCriteria: {
      tenth: '',
      twelfth: '',
      cgpa: '',
    },
    departmentCriteria: {
      CSE: { tenth: '', twelfth: '', cgpa: '' },
      IT: { tenth: '', twelfth: '', cgpa: '' },
      ECE: { tenth: '', twelfth: '', cgpa: '' },
      EEE: { tenth: '', twelfth: '', cgpa: '' },
      MECH: { tenth: '', twelfth: '', cgpa: '' },
      CIVIL: { tenth: '', twelfth: '', cgpa: '' },
    },
    // Job Department Access - Which departments can see this job
    jobDepartmentAccess: 'all', // 'all' or 'specific'
    specificJobDepartments: [], // List of dept codes if 'specific'
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

  const departmentNames = {
    CSE: 'Computer Science',
    IT: 'Information Technology',
    ECE: 'Electronics & Communication',
    EEE: 'Electrical Engineering',
    MECH: 'Mechanical Engineering',
    CIVIL: 'Civil Engineering',
  };

  const allDepartments = [
    { code: 'CSE', name: 'Computer Science' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'ECE', name: 'Electronics & Communication' },
    { code: 'EEE', name: 'Electrical Engineering' },
    { code: 'MECH', name: 'Mechanical Engineering' },
    { code: 'CIVIL', name: 'Civil Engineering' },
    { code: 'AIML', name: 'AI & Machine Learning' },
    { code: 'ADS', name: 'Advanced Data Science' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCommonCriteriaChange = (field, value) => {
    setFormData({
      ...formData,
      commonCriteria: {
        ...formData.commonCriteria,
        [field]: value,
      },
    });
  };

  const handleDepartmentCriteriaChange = (dept, field, value) => {
    setFormData({
      ...formData,
      departmentCriteria: {
        ...formData.departmentCriteria,
        [dept]: {
          ...formData.departmentCriteria[dept],
          [field]: value,
        },
      },
    });
  };

  const handleJobDepartmentToggle = (deptCode) => {
    setFormData({
      ...formData,
      specificJobDepartments: formData.specificJobDepartments.includes(deptCode)
        ? formData.specificJobDepartments.filter((d) => d !== deptCode)
        : [...formData.specificJobDepartments, deptCode],
    });
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
      // Build eligibility structure based on type
      let eligibilityData = {};
      
      if (formData.eligibilityType === "common") {
        eligibilityData = {
          eligibilityType: "common",
          commonEligibility: {
            tenth: parseFloat(formData.commonCriteria.tenth) || 0,
            twelfth: parseFloat(formData.commonCriteria.twelfth) || 0,
            cgpa: parseFloat(formData.commonCriteria.cgpa) || 0,
          },
        };
      } else if (formData.eligibilityType === "department-wise") {
        // Filter out empty departments and build array only with filled entries
        const deptWiseEligibility = Object.entries(formData.departmentCriteria)
          .map(([dept, criteria]) => ({
            department: dept,
            tenth: parseFloat(criteria.tenth) || 0,
            twelfth: parseFloat(criteria.twelfth) || 0,
            cgpa: parseFloat(criteria.cgpa) || 0,
          }))
          // Include all departments, even with 0 values
          .filter(dept => dept.tenth > 0 || dept.twelfth > 0 || dept.cgpa > 0);
        
        // If no departments have criteria, still include all with 0 values
        const finalDeptWiseEligibility = deptWiseEligibility.length > 0 
          ? deptWiseEligibility
          : Object.entries(formData.departmentCriteria).map(([dept, criteria]) => ({
              department: dept,
              tenth: parseFloat(criteria.tenth) || 0,
              twelfth: parseFloat(criteria.twelfth) || 0,
              cgpa: parseFloat(criteria.cgpa) || 0,
            }));
        
        eligibilityData = {
          eligibilityType: "department-wise",
          departmentWiseEligibility: finalDeptWiseEligibility,
        };
      }

      // Map frontend field names to backend expected names
      const jobData = {
        title: formData.jobCategory,
        company: formData.companyName,
        description: formData.jobDescription,
        packageDetails: {
          ctc: formData.ctc,
        },
        location: formData.location,
        jobType: formData.jobType,
        deadline: formData.deadline,
        ...eligibilityData,
        // Job Department Access - Which departments can see this job
        eligibility: {
          type: formData.jobDepartmentAccess === 'all' ? 'all' : 'specific',
          departments: formData.jobDepartmentAccess === 'all' ? [] : formData.specificJobDepartments,
        },
        // Additional fields (can be stored in description or ignored for now)
        requirements: {
          skills: formData.skills,
          otherSkill: formData.otherSkill,
          termsConditions: formData.termsConditions,
        }
      };

      console.log('Submitting job data:', jobData);
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

              {/* Eligibility Criteria - New Department-wise System */}
              <div className="space-y-4 border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
                <h3 className="text-lg font-semibold text-indigo-700">Eligibility Criteria</h3>
                
                {/* Toggle between common and department-wise */}
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-indigo-300">
                  <Checkbox
                    id="eligibilityCommon"
                    checked={formData.eligibilityType === "common"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        eligibilityType: checked ? "common" : "department-wise",
                      })
                    }
                  />
                  <Label htmlFor="eligibilityCommon" className="cursor-pointer">
                    Same criteria for all departments
                  </Label>
                </div>

                {/* Common Criteria Section */}
                {formData.eligibilityType === "common" && (
                  <div className="space-y-4 bg-white p-4 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-600">Common Eligibility Criteria</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="common-tenth">10th Percentage (%)</Label>
                        <Input
                          id="common-tenth"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={formData.commonCriteria.tenth}
                          onChange={(e) => handleCommonCriteriaChange("tenth", e.target.value)}
                          placeholder="e.g. 80"
                        />
                      </div>
                      <div>
                        <Label htmlFor="common-twelfth">12th Percentage (%)</Label>
                        <Input
                          id="common-twelfth"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={formData.commonCriteria.twelfth}
                          onChange={(e) => handleCommonCriteriaChange("twelfth", e.target.value)}
                          placeholder="e.g. 85"
                        />
                      </div>
                      <div>
                        <Label htmlFor="common-cgpa">CGPA</Label>
                        <Input
                          id="common-cgpa"
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={formData.commonCriteria.cgpa}
                          onChange={(e) => handleCommonCriteriaChange("cgpa", e.target.value)}
                          placeholder="e.g. 7.5"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Department-wise Criteria Section */}
                {formData.eligibilityType === "department-wise" && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-indigo-600">Department-wise Eligibility Criteria</h4>
                    {Object.entries(formData.departmentCriteria).map(([deptCode, criteria]) => (
                      <div key={deptCode} className="bg-white p-4 rounded-lg border border-indigo-200">
                        <h5 className="font-medium text-indigo-600 mb-3">{departmentNames[deptCode]} ({deptCode})</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`${deptCode}-tenth`}>10th Percentage (%)</Label>
                            <Input
                              id={`${deptCode}-tenth`}
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={criteria.tenth}
                              onChange={(e) => handleDepartmentCriteriaChange(deptCode, "tenth", e.target.value)}
                              placeholder="e.g. 80"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${deptCode}-twelfth`}>12th Percentage (%)</Label>
                            <Input
                              id={`${deptCode}-twelfth`}
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={criteria.twelfth}
                              onChange={(e) => handleDepartmentCriteriaChange(deptCode, "twelfth", e.target.value)}
                              placeholder="e.g. 85"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${deptCode}-cgpa`}>CGPA</Label>
                            <Input
                              id={`${deptCode}-cgpa`}
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={criteria.cgpa}
                              onChange={(e) => handleDepartmentCriteriaChange(deptCode, "cgpa", e.target.value)}
                              placeholder="e.g. 7.5"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Department Access - Which departments can see/apply for this job */}
              <div className="space-y-4 border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="text-lg font-semibold text-green-700">Job Department Access</h3>
                <p className="text-sm text-gray-600">Choose which departments can view and apply for this job</p>
                
                {/* Toggle: All vs Specific */}
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-green-300">
                  <Checkbox
                    id="jobAccessAll"
                    checked={formData.jobDepartmentAccess === "all"}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        jobDepartmentAccess: checked ? "all" : "specific",
                        specificJobDepartments: checked ? [] : formData.specificJobDepartments,
                      })
                    }
                  />
                  <Label htmlFor="jobAccessAll" className="cursor-pointer">
                    All Departments Eligible
                  </Label>
                </div>

                {/* Specific Departments Selection */}
                {formData.jobDepartmentAccess === "specific" && (
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-600">Select Departments That Can Access This Job</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allDepartments.map((dept) => (
                        <div key={dept.code} className="flex items-center space-x-2">
                          <Checkbox
                            id={`job-dept-${dept.code}`}
                            checked={formData.specificJobDepartments.includes(dept.code)}
                            onCheckedChange={() => handleJobDepartmentToggle(dept.code)}
                          />
                          <Label 
                            htmlFor={`job-dept-${dept.code}`} 
                            className="cursor-pointer text-sm"
                          >
                            {dept.name} ({dept.code})
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.specificJobDepartments.length === 0 && (
                      <p className="text-red-500 text-sm mt-2">
                        Please select at least one department
                      </p>
                    )}
                  </div>
                )}
              </div>
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
