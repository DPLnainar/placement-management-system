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
    openToAllBranches: true, // New field
    eligible_branches: [],
    min_cgpa: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
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
        eligibilityCriteria: {
          minCGPA: parseFloat(formData.min_cgpa) || 0,
          openToAllBranches: formData.openToAllBranches,
          eligibleBranches: formData.eligible_branches,
        },
      };

      const response = await fetch("http://127.0.0.1:8000/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        alert("Job posted successfully!");
        navigate(`/${role}/dashboard`);
      } else {
        const error = await response.json();
        alert(`Failed to post job: ${error.message}`);
      }
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Error posting job");
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

            {/* Min CGPA and Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_cgpa">Minimum CGPA</Label>
                <Input
                  id="min_cgpa"
                  name="min_cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.min_cgpa}
                  onChange={handleChange}
                  placeholder="e.g. 7.5"
                  required
                />
              </div>
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
