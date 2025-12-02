import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Briefcase, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";

function AddJob() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || "admin";

  const [formData, setFormData] = useState({
    company_name: "",
    job_role: "",
    description: "",
    ctc: "",
    location: "",
    openToAllBranches: true,
    eligible_branches: [],
    jobBelongsToAllDepts: true, // Job department category
    jobDepartments: [], // Specific departments
    eligibilityType: "common", // New: 'common' or 'department-wise'
    commonCriteria: {
      tenth: "",
      twelfth: "",
      cgpa: "",
    },
    departmentCriteria: {
      CSE: { tenth: "", twelfth: "", cgpa: "" },
      IT: { tenth: "", twelfth: "", cgpa: "" },
      ECE: { tenth: "", twelfth: "", cgpa: "" },
      EEE: { tenth: "", twelfth: "", cgpa: "" },
      MECH: { tenth: "", twelfth: "", cgpa: "" },
      CIVIL: { tenth: "", twelfth: "", cgpa: "" },
    },
    deadline: "",
  });

  const branches = [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
  ];

  // Department code mapping for backend API
  const departmentCodes = {
    "Computer Science": "CSE",
    "Information Technology": "IT",
    "Electronics & Communication": "ECE",
    "Electrical Engineering": "EEE",
    "Mechanical Engineering": "MECH",
    "Civil Engineering": "CIVIL",
  };

  const departmentNames = {
    CSE: "Computer Science",
    IT: "Information Technology",
    ECE: "Electronics & Communication",
    EEE: "Electrical Engineering",
    MECH: "Mechanical Engineering",
    CIVIL: "Civil Engineering",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBranchToggle = (branch) => {
    setFormData({
      ...formData,
      eligible_branches: formData.eligible_branches.includes(branch)
        ? formData.eligible_branches.filter((b) => b !== branch)
        : [...formData.eligible_branches, branch],
    });
  };

  const handleDepartmentToggle = (dept) => {
    setFormData({
      ...formData,
      jobDepartments: formData.jobDepartments.includes(dept)
        ? formData.jobDepartments.filter((d) => d !== dept)
        : [...formData.jobDepartments, dept],
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
          // Include all departments, even with 0 values (backend will validate)
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

      // Map form data to backend format
      const jobData = {
        title: formData.job_role,
        company: formData.company_name,
        description: formData.description,
        location: formData.location,
        deadline: formData.deadline,
        packageDetails: {
          ctc: parseFloat(formData.ctc) || 0,
        },
        ...eligibilityData,
        departmentCategory: {
          isCommonForAll: formData.jobBelongsToAllDepts,
          specificDepartments: formData.jobDepartments,
        },
      };

      console.log('Submitting job data:', jobData);

      const response = await fetch("http://127.0.0.1:8000/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Job created successfully:', result);
        alert("Job posted successfully!");
        navigate(`/${role}/dashboard`);
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(`Failed to post job: ${error.message || JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error("Error posting job:", error);
      alert(`Error posting job: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/${role}/dashboard`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Add New Job</h1>
                <p className="text-slate-600">Post a new job opportunity for students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g. Google, Microsoft"
                required
              />
            </div>

            {/* Job Role */}
            <div>
              <Label htmlFor="job_role">Job Role</Label>
              <Input
                id="job_role"
                name="job_role"
                value={formData.job_role}
                onChange={handleChange}
                placeholder="e.g. Software Engineer, Data Analyst"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the job role, responsibilities, requirements..."
                rows={5}
                required
              />
            </div>

            {/* CTC and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ctc">CTC (in LPA)</Label>
                <Input
                  id="ctc"
                  name="ctc"
                  type="number"
                  step="0.01"
                  value={formData.ctc}
                  onChange={handleChange}
                  placeholder="e.g. 12.5"
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
                  placeholder="e.g. Bangalore, Remote"
                  required
                />
              </div>
            </div>

            {/* Job Department Category */}
            <div className="space-y-4">
              <div>
                <Label className="mb-3 block font-semibold text-green-700">Job Department Category</Label>
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Checkbox
                    id="jobBelongsToAllDepts"
                    checked={formData.jobBelongsToAllDepts}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        jobBelongsToAllDepts: checked,
                        jobDepartments: checked ? [] : formData.jobDepartments,
                      })
                    }
                  />
                  <label
                    htmlFor="jobBelongsToAllDepts"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Common for All Departments
                  </label>
                </div>
              </div>

              {/* Show department checkboxes only if not common for all */}
              {!formData.jobBelongsToAllDepts && (
                <div>
                  <Label className="mb-3 block text-sm text-gray-600">
                    Which departments does this job belong to?
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {branches.map((dept) => (
                      <div key={dept} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept}`}
                          checked={formData.jobDepartments.includes(dept)}
                          onCheckedChange={() => handleDepartmentToggle(dept)}
                        />
                        <label
                          htmlFor={`dept-${dept}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {dept}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Eligible Branches - Toggle for All Departments */}
            <div className="space-y-4">
              <div>
                <Label className="mb-3 block font-semibold">Eligible Departments</Label>
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox
                    id="openToAllBranches"
                    checked={formData.openToAllBranches}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        openToAllBranches: checked,
                        eligible_branches: checked ? [] : formData.eligible_branches,
                      })
                    }
                  />
                  <label
                    htmlFor="openToAllBranches"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Open to All Departments
                  </label>
                </div>
              </div>

              {/* Show branch checkboxes only if not open to all */}
              {!formData.openToAllBranches && (
                <div>
                  <Label className="mb-3 block text-sm text-gray-600">
                    Select Departments (Leave empty = All)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {branches.map((branch) => (
                      <div key={branch} className="flex items-center space-x-2">
                        <Checkbox
                          id={branch}
                          checked={formData.eligible_branches.includes(branch)}
                          onCheckedChange={() => handleBranchToggle(branch)}
                        />
                        <label
                          htmlFor={branch}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {branch}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Eligibility Criteria Section */}
            <div className="space-y-4 border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
              <div>
                <Label className="mb-3 block font-semibold text-indigo-700 text-lg">
                  📋 Eligibility Criteria
                </Label>
                <p className="text-sm text-gray-600 mb-4">
                  Set minimum requirements (10th%, 12th%, CGPA) for students to apply for this job
                </p>
                
                {/* Toggle between common and department-wise */}
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-indigo-300 mb-4">
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
                  <label
                    htmlFor="eligibilityCommon"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Same criteria for all departments
                  </label>
                </div>
              </div>

              {/* Common Criteria Section */}
              {formData.eligibilityType === "common" && (
                <div className="space-y-4 bg-white p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-semibold text-indigo-600 mb-3">Common Eligibility Criteria</h3>
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
                  <h3 className="font-semibold text-indigo-600 mb-3">Department-wise Eligibility Criteria</h3>
                  {Object.entries(formData.departmentCriteria).map(([deptCode, criteria]) => (
                    <div key={deptCode} className="bg-white p-4 rounded-lg border border-indigo-200">
                      <h4 className="font-medium text-indigo-600 mb-3">{departmentNames[deptCode]} ({deptCode})</h4>
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

            {/* Deadline */}
            <div>
              <Label htmlFor="deadline">Application Deadline</Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/${role}/dashboard`)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Briefcase className="w-4 h-4 mr-2" />
                Post Job
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddJob;
