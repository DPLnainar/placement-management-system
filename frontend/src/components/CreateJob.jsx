import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Plus, X } from 'lucide-react';

export default function CreateJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    title: '',
    role: '',
    description: '',
    location: '',
    deadline: '',
    categories: ['fulltime'],
    packageLPA: '',
    stipend: '',
    durationMonths: '',
    eligibilityMode: 'common',
    tenthPct: '',
    twelfthPct: '',
    cgpa: '',
    allowArrears: false,
    targetDepartments: [],
    selectAllDepts: false,
    otherDepartment: '',
  });

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [rounds, setRounds] = useState([]);
  const [roundInput, setRoundInput] = useState('');
  const [customDeptRules, setCustomDeptRules] = useState([]);

  const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'ISE', 'MBA', 'MCA'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleCategoryToggle = (category) => {
    if (formData.categories.includes(category)) {
      setFormData({
        ...formData,
        categories: formData.categories.filter(c => c !== category),
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, category],
      });
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleAddRound = () => {
    if (roundInput.trim()) {
      setRounds([...rounds, { roundName: roundInput.trim() }]);
      setRoundInput('');
    }
  };

  const handleRemoveRound = (index) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const handleDeptToggle = (dept) => {
    if (formData.targetDepartments.includes(dept)) {
      setFormData({
        ...formData,
        targetDepartments: formData.targetDepartments.filter(d => d !== dept),
        selectAllDepts: false,
      });
    } else {
      const newDepts = [...formData.targetDepartments, dept];
      setFormData({
        ...formData,
        targetDepartments: newDepts,
        selectAllDepts: newDepts.length === DEPARTMENTS.length,
      });
    }
  };

  const handleSelectAllDepts = (checked) => {
    setFormData({
      ...formData,
      selectAllDepts: checked,
      targetDepartments: checked ? [...DEPARTMENTS] : [],
    });
  };

  const handleAddCustomDeptRule = () => {
    setCustomDeptRules([
      ...customDeptRules,
      {
        department: '',
        minTenthPct: '',
        minTwelfthPct: '',
        minCGPA: '',
        allowArrears: false,
      },
    ]);
  };

  const handleRemoveCustomDeptRule = (index) => {
    setCustomDeptRules(customDeptRules.filter((_, i) => i !== index));
  };

  const handleCustomDeptRuleChange = (index, field, value) => {
    const updated = [...customDeptRules];
    updated[index] = { ...updated[index], [field]: value };
    setCustomDeptRules(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.categories.length === 0) {
      alert('Please select at least one job category (Full-time or Internship)');
      return;
    }

    setLoading(true);

    try {
      const targetDepts = [
        ...formData.targetDepartments,
        ...(formData.otherDepartment ? [formData.otherDepartment.trim()] : []),
      ];

      const eligibility = {
        tenthPct: parseFloat(formData.tenthPct) || undefined,
        twelfthPct: parseFloat(formData.twelfthPct) || undefined,
        cgpa: parseFloat(formData.cgpa) || undefined,
        allowArrears: formData.allowArrears,
        deptList: targetDepts,
        customDeptRules: formData.eligibilityMode === 'per-dept'
          ? customDeptRules.map(rule => ({
            department: rule.department,
            minTenthPct: parseFloat(rule.minTenthPct) || undefined,
            minTwelfthPct: parseFloat(rule.minTwelfthPct) || undefined,
            minCGPA: parseFloat(rule.minCGPA) || undefined,
            allowArrears: rule.allowArrears,
          }))
          : [],
      };

      const jobData = {
        companyName: formData.companyName,
        title: formData.title,
        role: formData.role,
        description: formData.description,
        location: formData.location,
        deadline: formData.deadline,
        category: formData.categories,
        packageLPA: formData.categories.includes('fulltime') ? parseFloat(formData.packageLPA) : undefined,
        stipend: formData.categories.includes('intern') ? parseFloat(formData.stipend) : undefined,
        durationMonths: formData.categories.includes('intern') ? parseInt(formData.durationMonths) : undefined,
        skillsRequired: skills,
        hiringRounds: rounds,
        targetDepartments: targetDepts,
        eligibility,
        jobType: formData.categories.includes('intern') ? 'internship' : 'full-time',
      };

      console.log('Submitting job data:', jobData);
      const response = await adminAPI.createJob(jobData);

      if (response.data.success) {
        alert('Job created successfully! Eligible students have been notified via email.');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Job creation error:', error);
      alert(error.response?.data?.message || 'Error creating job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Job Posting</CardTitle>
            <CardDescription>
              Fill in the details for the new job opportunity. Eligible students will be automatically notified via email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Details */}
              <div className="space-y-4 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-700">Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input id="title" name="title" placeholder="e.g., Software Engineer" value={formData.title} onChange={handleChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Job Role *</Label>
                    <Input id="role" name="role" placeholder="e.g., Backend Developer" value={formData.role} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input id="location" name="location" value={formData.location} onChange={handleChange} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="deadline">Application Deadline *</Label>
                  <Input id="deadline" name="deadline" type="datetime-local" value={formData.deadline} onChange={handleChange} required />
                </div>
              </div>

              {/* Job Category & Package */}
              <div className="space-y-4 border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="text-lg font-semibold text-purple-700">Job Category & Package</h3>
                <div>
                  <Label>Job Category * (Select one or both)</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center">
                      <input type="checkbox" checked={formData.categories.includes('fulltime')} onChange={() => handleCategoryToggle('fulltime')} className="mr-2" />
                      Full-time
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked={formData.categories.includes('intern')} onChange={() => handleCategoryToggle('intern')} className="mr-2" />
                      Internship
                    </label>
                  </div>
                  {formData.categories.length === 0 && <p className="text-sm text-red-600 mt-1">Please select at least one category</p>}
                </div>
                {formData.categories.includes('fulltime') && (
                  <div>
                    <Label htmlFor="packageLPA">Package (LPA) *</Label>
                    <Input id="packageLPA" name="packageLPA" type="number" step="0.1" placeholder="e.g., 12" value={formData.packageLPA} onChange={handleChange} required />
                  </div>
                )}
                {formData.categories.includes('intern') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stipend">Stipend (₹/month) *</Label>
                      <Input id="stipend" name="stipend" type="number" placeholder="e.g., 15000" value={formData.stipend} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="durationMonths">Duration (months) *</Label>
                      <Input id="durationMonths" name="durationMonths" type="number" placeholder="e.g., 6" value={formData.durationMonths} onChange={handleChange} required />
                    </div>
                  </div>
                )}
              </div>

              {/* Skills & Workflow */}
              <div className="space-y-4 border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="text-lg font-semibold text-green-700">Skills & Hiring Workflow</h3>
                <div>
                  <Label>Skills Required</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())} placeholder="Add skill and press Enter" />
                    <Button type="button" onClick={handleAddSkill} size="sm"><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skills.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(idx)} className="ml-2 text-green-600 hover:text-green-800"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Hiring Workflow Rounds</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={roundInput} onChange={(e) => setRoundInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRound())} placeholder="e.g., Online Test" />
                    <Button type="button" onClick={handleAddRound} size="sm"><Plus className="h-4 w-4" /></Button>
                  </div>
                  {rounds.length > 0 && (
                    <ol className="list-decimal list-inside mt-3 space-y-2">
                      {rounds.map((round, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-white p-2 rounded">
                          <span>{round.roundName}</span>
                          <button type="button" onClick={() => handleRemoveRound(idx)} className="text-red-600 hover:text-red-800"><X className="h-4 w-4" /></button>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>

              {/* Eligibility */}
              <div className="space-y-4 border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
                <h3 className="text-lg font-semibold text-indigo-700">Eligibility Criteria</h3>
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                  <Checkbox id="eligibilityCommon" checked={formData.eligibilityMode === 'common'} onCheckedChange={(checked) => setFormData({ ...formData, eligibilityMode: checked ? 'common' : 'per-dept' })} />
                  <Label htmlFor="eligibilityCommon" className="cursor-pointer">Same criteria for all departments</Label>
                </div>
                {formData.eligibilityMode === 'common' && (
                  <div className="space-y-4 bg-white p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><Label htmlFor="tenthPct">10th Percentage (Min)</Label><Input id="tenthPct" name="tenthPct" type="number" step="0.1" min="0" max="100" value={formData.tenthPct} onChange={handleChange} placeholder="e.g., 60" /></div>
                      <div><Label htmlFor="twelfthPct">12th Percentage (Min)</Label><Input id="twelfthPct" name="twelfthPct" type="number" step="0.1" min="0" max="100" value={formData.twelfthPct} onChange={handleChange} placeholder="e.g., 60" /></div>
                      <div><Label htmlFor="cgpa">CGPA (Min)</Label><Input id="cgpa" name="cgpa" type="number" step="0.1" min="0" max="10" value={formData.cgpa} onChange={handleChange} placeholder="e.g., 7.0" /></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="allowArrears" name="allowArrears" checked={formData.allowArrears} onCheckedChange={(checked) => setFormData({ ...formData, allowArrears: checked })} />
                      <Label htmlFor="allowArrears" className="cursor-pointer">Allow students with arrear history</Label>
                    </div>
                  </div>
                )}
                {formData.eligibilityMode === 'per-dept' && (
                  <div className="space-y-4">
                    {customDeptRules.map((rule, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-indigo-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-indigo-600">Rule {idx + 1}</h4>
                          <button type="button" onClick={() => handleRemoveCustomDeptRule(idx)} className="text-red-600 hover:text-red-800"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><Label>Department</Label><select value={rule.department} onChange={(e) => handleCustomDeptRuleChange(idx, 'department', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Select department</option>{DEPARTMENTS.map(dept => (<option key={dept} value={dept}>{dept}</option>))}</select></div>
                          <div><Label>10th Min (%)</Label><Input type="number" step="0.1" value={rule.minTenthPct} onChange={(e) => handleCustomDeptRuleChange(idx, 'minTenthPct', e.target.value)} /></div>
                          <div><Label>12th Min (%)</Label><Input type="number" step="0.1" value={rule.minTwelfthPct} onChange={(e) => handleCustomDeptRuleChange(idx, 'minTwelfthPct', e.target.value)} /></div>
                          <div><Label>CGPA Min</Label><Input type="number" step="0.1" value={rule.minCGPA} onChange={(e) => handleCustomDeptRuleChange(idx, 'minCGPA', e.target.value)} /></div>
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <Checkbox checked={rule.allowArrears} onCheckedChange={(checked) => handleCustomDeptRuleChange(idx, 'allowArrears', checked)} />
                          <Label className="cursor-pointer">Allow arrears for this department</Label>
                        </div>
                      </div>
                    ))}
                    <Button type="button" onClick={handleAddCustomDeptRule} variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Department Rule</Button>
                  </div>
                )}
              </div>

              {/* Target Departments */}
              <div className="space-y-4 border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                <h3 className="text-lg font-semibold text-orange-700">Target Departments</h3>
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg">
                  <Checkbox id="selectAllDepts" checked={formData.selectAllDepts} onCheckedChange={handleSelectAllDepts} />
                  <Label htmlFor="selectAllDepts" className="cursor-pointer font-medium">All Departments</Label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-lg">
                  {DEPARTMENTS.map(dept => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox id={`dept-${dept}`} checked={formData.targetDepartments.includes(dept)} onCheckedChange={() => handleDeptToggle(dept)} />
                      <Label htmlFor={`dept-${dept}`} className="cursor-pointer">{dept}</Label>
                    </div>
                  ))}
                </div>
                <div>
                  <Label htmlFor="otherDepartment">Other Department (Not Listed)</Label>
                  <Input id="otherDepartment" name="otherDepartment" placeholder="e.g., Biomedical Engineering" value={formData.otherDepartment} onChange={handleChange} className="mt-2" />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating & Notifying Students...' : 'Create Job & Notify Students'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')} disabled={loading}>
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
