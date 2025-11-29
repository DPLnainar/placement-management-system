import { useState } from "react";
import { Eye, EyeOff, Building2, Users, UserPlus, LayoutDashboard, Menu, X, GraduationCap } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Checkbox } from "./components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Label } from "./components/ui/label";
import "./App.css";

function App() {
  const [page, setPage] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  
  // Moderators state
  const [moderators, setModerators] = useState([]);
  const [loadingModerators, setLoadingModerators] = useState(false);
  
  // Add moderator form state
  const [newModerator, setNewModerator] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    department: ""
  });
  const [moderatorErrors, setModeratorErrors] = useState({});
  
  // Job posting form state
  const [formData, setFormData] = useState({
    companyName: "",
    location: "",
    jobCategory: "",
    jobDescription: "",
    termsConditions: "",
    tenthPercentage: "",
    twelfthPercentage: "",
    cgpa: "",
    deadline: "",
    skills: {
      wirelessCommunication: false,
      fullstackDeveloper: false,
      embedded: false,
      vlsi: false,
      cybersecurity: false,
      cloud: false,
      networking: false,
      blockchain: false,
      others: false
    },
    otherSkill: ""
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Edit job state
  const [editingJobId, setEditingJobId] = useState(null);

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  // Fetch jobs
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Fetch moderators
  const fetchModerators = async () => {
    setLoadingModerators(true);
    try {
      const response = await fetch(`${API_BASE_URL}/moderators`);
      if (response.ok) {
        const data = await response.json();
        setModerators(data);
      }
    } catch (error) {
      console.error("Error fetching moderators:", error);
    } finally {
      setLoadingModerators(false);
    }
  };

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");
    
    if (username === "admin" && password === "admin") {
      setPage("adminDashboard");
      setUsername("");
      setPassword("");
    } else {
      setLoginError("Invalid credentials. Please try again.");
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSkillChange = (skill, checked) => {
    setFormData(prev => ({
      ...prev,
      skills: { ...prev.skills, [skill]: checked }
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.companyName.trim()) errors.companyName = "Company name is required";
    if (!formData.location.trim()) errors.location = "Location is required";
    if (!formData.jobCategory.trim()) errors.jobCategory = "Job category is required";
    if (!formData.jobDescription.trim()) errors.jobDescription = "Job description is required";
    if (!formData.termsConditions.trim()) errors.termsConditions = "Terms & conditions are required";
    
    if (!formData.deadline) {
      errors.deadline = "Application deadline is required";
    }
    
    if (!formData.tenthPercentage || formData.tenthPercentage < 0 || formData.tenthPercentage > 100) {
      errors.tenthPercentage = "Valid 10th percentage (0-100) is required";
    }
    if (!formData.twelfthPercentage || formData.twelfthPercentage < 0 || formData.twelfthPercentage > 100) {
      errors.twelfthPercentage = "Valid 12th/Diploma percentage (0-100) is required";
    }
    if (!formData.cgpa || formData.cgpa < 0 || formData.cgpa > 10) {
      errors.cgpa = "Valid CGPA (0-10) is required";
    }
    
    const hasSkillSelected = Object.values(formData.skills).some(v => v === true);
    if (!hasSkillSelected) {
      errors.skills = "Please select at least one role requirement";
    }
    
    if (formData.skills.others && !formData.otherSkill.trim()) {
      errors.otherSkill = "Please specify the other requirement";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const jobData = {
          ...formData,
          tenthPercentage: parseFloat(formData.tenthPercentage),
          twelfthPercentage: parseFloat(formData.twelfthPercentage),
          cgpa: parseFloat(formData.cgpa),
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        };
        
        const response = await fetch(`${API_BASE_URL}/jobs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jobData),
        });

        if (response.ok) {
          console.log("Job posting created successfully");
          setShowSuccess(true);
          
          // Reset form
          setFormData({
            companyName: "",
            location: "",
            jobCategory: "",
            jobDescription: "",
            termsConditions: "",
            tenthPercentage: "",
            twelfthPercentage: "",
            cgpa: "",
            deadline: "",
            skills: {
              wirelessCommunication: false,
              fullstackDeveloper: false,
              embedded: false,
              vlsi: false,
              cybersecurity: false,
              cloud: false,
              networking: false,
              blockchain: false,
              others: false
            },
            otherSkill: ""
          });
          
          // Hide success message after 5 seconds
          setTimeout(() => setShowSuccess(false), 5000);
          
          // Refresh jobs list if on jobs page
          if (page === "jobs") {
            fetchJobs();
          }
        } else {
          const errorData = await response.json();
          console.error("Failed to create job posting:", errorData);
          alert(errorData.detail || "Error creating job posting");
        }
      } catch (error) {
        console.error("Error creating job posting:", error);
        alert("Error creating job posting");
      }
    }
  };

  // Handle moderator form submission
  const handleAddModerator = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!newModerator.username.trim()) errors.username = "Username is required";
    if (!newModerator.email.trim()) errors.email = "Email is required";
    if (!newModerator.fullName.trim()) errors.fullName = "Full name is required";
    if (!newModerator.department) errors.department = "Department is required";
    if (!newModerator.password || newModerator.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setModeratorErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/moderators`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newModerator),
        });

        if (response.ok) {
          setShowSuccess(true);
          setNewModerator({ username: "", email: "", fullName: "", password: "", department: "" });
          setTimeout(() => setShowSuccess(false), 5000);
          fetchModerators();
        } else {
          const errorData = await response.json();
          alert(errorData.detail || "Failed to add moderator");
        }
      } catch (error) {
        console.error("Error adding moderator:", error);
        alert("Error adding moderator");
      }
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          fetchJobs();
        }
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    }
  };

  // Edit job
  const handleEditJob = async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
      if (response.ok) {
        const job = await response.json();
        
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
        setEditingJobId(jobId);
        setPage("editJob");
      }
    } catch (error) {
      console.error("Error loading job:", error);
      alert("Error loading job details");
    }
  };

  // Update job
  const handleUpdateJob = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

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
        skills: formData.skills,
        otherSkill: formData.otherSkill,
      };

      const response = await fetch(`${API_BASE_URL}/jobs/${editingJobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setPage("adminDashboard");
          setEditingJobId(null);
          resetForm();
          fetchJobs();
        }, 2000);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Error updating job");
      }
    } catch (error) {
      console.error("Error updating job:", error);
      alert("Error updating job posting");
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      location: "",
      jobCategory: "",
      jobDescription: "",
      termsConditions: "",
      tenthPercentage: "",
      twelfthPercentage: "",
      cgpa: "",
      deadline: "",
      skills: {
        wirelessCommunication: false,
        fullstackDeveloper: false,
        embedded: false,
        vlsi: false,
        cybersecurity: false,
        cloud: false,
        networking: false,
        blockchain: false,
        others: false
      },
      otherSkill: ""
    });
    setFormErrors({});
  };

  // Delete moderator
  const handleDeleteModerator = async (moderatorId) => {
    if (window.confirm("Are you sure you want to delete this moderator?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/moderators/${moderatorId}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          fetchModerators();
        }
      } catch (error) {
        console.error("Error deleting moderator:", error);
      }
    }
  };

  // Toggle moderator status
  const handleToggleModeratorStatus = async (moderatorId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/moderators/${moderatorId}/status?isActive=${!currentStatus}`, {
        method: "PUT",
      });
      
      if (response.ok) {
        fetchModerators();
      }
    } catch (error) {
      console.error("Error updating moderator status:", error);
    }
  };

  // Login Page
  if (page === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Placement Portal</CardTitle>
            <CardDescription className="text-slate-600">Sign in to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {loginError}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Login
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue as</span>
                </div>
              </div>
              
              <Button
                type="button"
                onClick={() => setPage("studentDashboard")}
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                View Jobs as Student
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Student Dashboard
  if (page === "studentDashboard") {
    return <StudentDashboard />;
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md text-slate-700 hover:bg-slate-100 transition-colors"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-slate-800 text-white w-64 transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Placement Portal</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setPage("adminDashboard")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              page === "adminDashboard" ? "bg-blue-600 text-white" : "hover:bg-slate-700"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => { setPage("jobs"); fetchJobs(); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              page === "jobs" ? "bg-blue-600 text-white" : "hover:bg-slate-700"
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Jobs</span>
          </button>
          <button 
            onClick={() => { setPage("moderators"); fetchModerators(); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              page === "moderators" ? "bg-blue-600 text-white" : "hover:bg-slate-700"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Moderators</span>
          </button>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <Button
            onClick={() => setPage("login")}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
        ></div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Dashboard Page */}
          {page === "adminDashboard" && (
            <>
              <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="shadow-lg max-w-2xl w-full">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Building2 className="w-10 h-10 text-blue-600" />
                    </div>
                    <h2 className="text-4xl font-bold text-slate-800 mb-4">
                      Welcome, Admin! 👋
                    </h2>
                    <p className="text-lg text-slate-600 mb-8">
                      Manage your placement portal efficiently. Use the sidebar to navigate through jobs and moderators.
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-800">Jobs</p>
                        <p className="text-sm text-slate-600">Manage postings</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-800">Moderators</p>
                        <p className="text-sm text-slate-600">Manage team</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Create Job Page */}
          {page === "createJob" && (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Create Job Posting</h2>
                <p className="text-slate-600 mt-1">Fill in the details to post a new job opportunity</p>
              </div>

              {/* Success Message */}
              {showSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg shadow-sm animate-in fade-in duration-300">
                  <p className="font-medium">Job posted successfully!</p>
                  <p className="text-sm mt-1">The job posting has been created and is now visible to students.</p>
                </div>
              )}

          <Card className="shadow-md">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Company Information Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    Company Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-slate-700">
                        Company Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="e.g., Tech Solutions Inc."
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          formErrors.companyName ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.companyName && (
                        <p className="text-red-500 text-sm">{formErrors.companyName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-slate-700">
                        Location <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="e.g., Bangalore, India"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          formErrors.location ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.location && (
                        <p className="text-red-500 text-sm">{formErrors.location}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="jobCategory" className="text-slate-700">
                      Job Category <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="jobCategory"
                      type="text"
                      placeholder="e.g., Software Development, Data Science"
                      value={formData.jobCategory}
                      onChange={(e) => handleInputChange("jobCategory", e.target.value)}
                      className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                        formErrors.jobCategory ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.jobCategory && (
                      <p className="text-red-500 text-sm">{formErrors.jobCategory}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-slate-700">
                      Application Deadline <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange("deadline", e.target.value)}
                      className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                        formErrors.deadline ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.deadline && (
                      <p className="text-red-500 text-sm">{formErrors.deadline}</p>
                    )}
                    <p className="text-xs text-slate-500">Job will automatically become inactive after this date</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="jobDescription" className="text-slate-700">
                      Job Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="jobDescription"
                      placeholder="Describe the role, responsibilities, and requirements..."
                      value={formData.jobDescription}
                      onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                      rows={4}
                      className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none ${
                        formErrors.jobDescription ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.jobDescription && (
                      <p className="text-red-500 text-sm">{formErrors.jobDescription}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="termsConditions" className="text-slate-700">
                      Terms & Conditions <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="termsConditions"
                      placeholder="Enter terms and conditions for this position..."
                      value={formData.termsConditions}
                      onChange={(e) => handleInputChange("termsConditions", e.target.value)}
                      rows={4}
                      className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none ${
                        formErrors.termsConditions ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.termsConditions && (
                      <p className="text-red-500 text-sm">{formErrors.termsConditions}</p>
                    )}
                  </div>
                </div>

                {/* Eligibility Criteria Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    Eligibility Criteria
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenthPercentage" className="text-slate-700">
                        10th Percentage <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="tenthPercentage"
                        type="number"
                        placeholder="e.g., 75"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.tenthPercentage}
                        onChange={(e) => handleInputChange("tenthPercentage", e.target.value)}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          formErrors.tenthPercentage ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.tenthPercentage && (
                        <p className="text-red-500 text-sm">{formErrors.tenthPercentage}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="twelfthPercentage" className="text-slate-700">
                        12th/Diploma % <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="twelfthPercentage"
                        type="number"
                        placeholder="e.g., 80"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.twelfthPercentage}
                        onChange={(e) => handleInputChange("twelfthPercentage", e.target.value)}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          formErrors.twelfthPercentage ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.twelfthPercentage && (
                        <p className="text-red-500 text-sm">{formErrors.twelfthPercentage}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cgpa" className="text-slate-700">
                        CGPA <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cgpa"
                        type="number"
                        placeholder="e.g., 7.5"
                        min="0"
                        max="10"
                        step="0.01"
                        value={formData.cgpa}
                        onChange={(e) => handleInputChange("cgpa", e.target.value)}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          formErrors.cgpa ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.cgpa && (
                        <p className="text-red-500 text-sm">{formErrors.cgpa}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Requirements Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    Role Requirements <span className="text-red-500">*</span>
                  </h3>
                  
                  {formErrors.skills && (
                    <p className="text-red-500 text-sm">{formErrors.skills}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wirelessCommunication"
                        checked={formData.skills.wirelessCommunication}
                        onCheckedChange={(checked) => handleSkillChange("wirelessCommunication", checked)}
                      />
                      <Label
                        htmlFor="wirelessCommunication"
                        className="text-slate-700 cursor-pointer"
                      >
                        Wireless Communication
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fullstackDeveloper"
                        checked={formData.skills.fullstackDeveloper}
                        onCheckedChange={(checked) => handleSkillChange("fullstackDeveloper", checked)}
                      />
                      <Label
                        htmlFor="fullstackDeveloper"
                        className="text-slate-700 cursor-pointer"
                      >
                        Fullstack Developer (Python/Java)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="embedded"
                        checked={formData.skills.embedded}
                        onCheckedChange={(checked) => handleSkillChange("embedded", checked)}
                      />
                      <Label htmlFor="embedded" className="text-slate-700 cursor-pointer">
                        Embedded
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vlsi"
                        checked={formData.skills.vlsi}
                        onCheckedChange={(checked) => handleSkillChange("vlsi", checked)}
                      />
                      <Label htmlFor="vlsi" className="text-slate-700 cursor-pointer">
                        VLSI
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cybersecurity"
                        checked={formData.skills.cybersecurity}
                        onCheckedChange={(checked) => handleSkillChange("cybersecurity", checked)}
                      />
                      <Label htmlFor="cybersecurity" className="text-slate-700 cursor-pointer">
                        Cybersecurity
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cloud"
                        checked={formData.skills.cloud}
                        onCheckedChange={(checked) => handleSkillChange("cloud", checked)}
                      />
                      <Label htmlFor="cloud" className="text-slate-700 cursor-pointer">
                        Cloud
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="networking"
                        checked={formData.skills.networking}
                        onCheckedChange={(checked) => handleSkillChange("networking", checked)}
                      />
                      <Label htmlFor="networking" className="text-slate-700 cursor-pointer">
                        Networking
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="blockchain"
                        checked={formData.skills.blockchain}
                        onCheckedChange={(checked) => handleSkillChange("blockchain", checked)}
                      />
                      <Label htmlFor="blockchain" className="text-slate-700 cursor-pointer">
                        Blockchain
                      </Label>
                    </div>
                  </div>
                  
                  {/* Others Option */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="others"
                        checked={formData.skills.others}
                        onCheckedChange={(checked) => {
                          handleSkillChange("others", checked);
                          if (!checked) {
                            handleInputChange("otherSkill", "");
                          }
                        }}
                      />
                      <Label htmlFor="others" className="text-slate-700 cursor-pointer">
                        Others
                      </Label>
                    </div>
                    
                    {formData.skills.others && (
                      <div className="ml-6 space-y-2">
                        <Input
                          type="text"
                          placeholder="Please specify other requirement"
                          value={formData.otherSkill}
                          onChange={(e) => handleInputChange("otherSkill", e.target.value)}
                          className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                            formErrors.otherSkill ? "border-red-500" : ""
                          }`}
                        />
                        {formErrors.otherSkill && (
                          <p className="text-red-500 text-sm">{formErrors.otherSkill}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full md:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Post Job
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
            </>
          )}

          {/* Edit Job Page */}
          {page === "editJob" && (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Edit Job Posting</h2>
                <p className="text-slate-600 mt-1">Update the details for this job opportunity</p>
              </div>

              {/* Success Message */}
              {showSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg shadow-sm animate-in fade-in duration-300">
                  <p className="font-medium">Job updated successfully!</p>
                  <p className="text-sm mt-1">The job posting has been updated.</p>
                </div>
              )}

          <Card className="shadow-md">
            <CardContent className="p-6">
              <form onSubmit={handleUpdateJob} className="space-y-8">
                {/* Company Information Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    Company Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-companyName" className="text-slate-700">
                        Company Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-companyName"
                        type="text"
                        placeholder="Enter company name"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          formErrors.companyName ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.companyName && (
                        <p className="text-red-500 text-sm">{formErrors.companyName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-location" className="text-slate-700">
                        Location <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-location"
                        type="text"
                        placeholder="Enter job location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          formErrors.location ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.location && (
                        <p className="text-red-500 text-sm">{formErrors.location}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-jobCategory" className="text-slate-700">
                      Job Category <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-jobCategory"
                      type="text"
                      placeholder="e.g., Software Developer, Data Analyst"
                      value={formData.jobCategory}
                      onChange={(e) => handleInputChange("jobCategory", e.target.value)}
                      className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                        formErrors.jobCategory ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.jobCategory && (
                      <p className="text-red-500 text-sm">{formErrors.jobCategory}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-deadline" className="text-slate-700">
                      Application Deadline <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-deadline"
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange("deadline", e.target.value)}
                      className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                        formErrors.deadline ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.deadline && (
                      <p className="text-red-500 text-sm">{formErrors.deadline}</p>
                    )}
                    <p className="text-xs text-slate-500">Job will automatically become inactive after this date</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-jobDescription" className="text-slate-700">
                      Job Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="edit-jobDescription"
                      placeholder="Describe the role, responsibilities, and requirements..."
                      value={formData.jobDescription}
                      onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                      rows={4}
                      className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none ${
                        formErrors.jobDescription ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.jobDescription && (
                      <p className="text-red-500 text-sm">{formErrors.jobDescription}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-termsConditions" className="text-slate-700">
                      Terms & Conditions <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="edit-termsConditions"
                      placeholder="Enter terms and conditions for this position..."
                      value={formData.termsConditions}
                      onChange={(e) => handleInputChange("termsConditions", e.target.value)}
                      rows={4}
                      className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none ${
                        formErrors.termsConditions ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.termsConditions && (
                      <p className="text-red-500 text-sm">{formErrors.termsConditions}</p>
                    )}
                  </div>
                </div>

                {/* Eligibility Criteria Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    Eligibility Criteria
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-tenthPercentage" className="text-slate-700">
                        10th Percentage <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-tenthPercentage"
                        type="number"
                        step="0.01"
                        placeholder="0-100"
                        value={formData.tenthPercentage}
                        onChange={(e) => handleInputChange("tenthPercentage", e.target.value)}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          formErrors.tenthPercentage ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.tenthPercentage && (
                        <p className="text-red-500 text-sm">{formErrors.tenthPercentage}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-twelfthPercentage" className="text-slate-700">
                        12th/Diploma Percentage <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-twelfthPercentage"
                        type="number"
                        step="0.01"
                        placeholder="0-100"
                        value={formData.twelfthPercentage}
                        onChange={(e) => handleInputChange("twelfthPercentage", e.target.value)}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          formErrors.twelfthPercentage ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.twelfthPercentage && (
                        <p className="text-red-500 text-sm">{formErrors.twelfthPercentage}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-cgpa" className="text-slate-700">
                        CGPA <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-cgpa"
                        type="number"
                        step="0.01"
                        placeholder="0-10"
                        value={formData.cgpa}
                        onChange={(e) => handleInputChange("cgpa", e.target.value)}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          formErrors.cgpa ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.cgpa && (
                        <p className="text-red-500 text-sm">{formErrors.cgpa}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Required Skills Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    Required Skills
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-wirelessCommunication"
                        checked={formData.skills.wirelessCommunication}
                        onCheckedChange={(checked) => handleSkillChange("wirelessCommunication", checked)}
                      />
                      <Label htmlFor="edit-wirelessCommunication" className="text-slate-700 cursor-pointer">
                        Wireless Communication
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-fullstackDeveloper"
                        checked={formData.skills.fullstackDeveloper}
                        onCheckedChange={(checked) => handleSkillChange("fullstackDeveloper", checked)}
                      />
                      <Label htmlFor="edit-fullstackDeveloper" className="text-slate-700 cursor-pointer">
                        Fullstack Developer
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-embedded"
                        checked={formData.skills.embedded}
                        onCheckedChange={(checked) => handleSkillChange("embedded", checked)}
                      />
                      <Label htmlFor="edit-embedded" className="text-slate-700 cursor-pointer">
                        Embedded
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-vlsi"
                        checked={formData.skills.vlsi}
                        onCheckedChange={(checked) => handleSkillChange("vlsi", checked)}
                      />
                      <Label htmlFor="edit-vlsi" className="text-slate-700 cursor-pointer">
                        VLSI
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-cybersecurity"
                        checked={formData.skills.cybersecurity}
                        onCheckedChange={(checked) => handleSkillChange("cybersecurity", checked)}
                      />
                      <Label htmlFor="edit-cybersecurity" className="text-slate-700 cursor-pointer">
                        Cybersecurity
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-cloud"
                        checked={formData.skills.cloud}
                        onCheckedChange={(checked) => handleSkillChange("cloud", checked)}
                      />
                      <Label htmlFor="edit-cloud" className="text-slate-700 cursor-pointer">
                        Cloud Computing
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-networking"
                        checked={formData.skills.networking}
                        onCheckedChange={(checked) => handleSkillChange("networking", checked)}
                      />
                      <Label htmlFor="edit-networking" className="text-slate-700 cursor-pointer">
                        Networking
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-blockchain"
                        checked={formData.skills.blockchain}
                        onCheckedChange={(checked) => handleSkillChange("blockchain", checked)}
                      />
                      <Label htmlFor="edit-blockchain" className="text-slate-700 cursor-pointer">
                        Blockchain
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-others"
                        checked={formData.skills.others}
                        onCheckedChange={(checked) => handleSkillChange("others", checked)}
                      />
                      <Label htmlFor="edit-others" className="text-slate-700 cursor-pointer">
                        Others
                      </Label>
                    </div>
                  </div>
                  
                  {formData.skills.others && (
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="edit-otherSkill" className="text-slate-700">
                        Specify Other Skill
                      </Label>
                      <Input
                        id="edit-otherSkill"
                        type="text"
                        placeholder="Enter other required skill"
                        value={formData.otherSkill}
                        onChange={(e) => handleInputChange("otherSkill", e.target.value)}
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  
                  {formErrors.skills && (
                    <p className="text-red-500 text-sm">{formErrors.skills}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Update Job
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPage("jobs");
                      setEditingJobId(null);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
            </>
          )}

          {/* View Jobs Page */}
          {page === "jobs" && (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Job Management</h2>
                <p className="text-slate-600 mt-1">Create and manage job opportunities</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Create Job Form */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Add New Job</CardTitle>
                    <CardDescription>Post a new job opportunity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setPage("createJob")}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Job Posting
                    </Button>
                  </CardContent>
                </Card>

                {/* Job Statistics */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Job Statistics</CardTitle>
                    <CardDescription>Overview of job postings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-blue-600">{jobs.length}</p>
                      <p className="text-slate-600 mt-2">Total Job Postings</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-xl font-semibold text-slate-800 mb-4">All Job Postings</h3>

              {loadingJobs ? (
                <div className="text-center py-12">
                  <p className="text-slate-600">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600">No job postings yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <Card key={job.id} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800">{job.companyName}</h3>
                            <p className="text-slate-600 mt-1">{job.jobCategory}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                              <span>📍 {job.location}</span>
                              <span>📊 CGPA: {job.cgpa}</span>
                            </div>
                            <p className="mt-3 text-slate-700 line-clamp-2">{job.jobDescription}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {Object.entries(job.skills).map(([skill, enabled]) => 
                                enabled && (
                                  <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                    {skill.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={() => handleEditJob(job.id)}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteJob(job.id)}
                              variant="destructive"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Moderators Page */}
          {page === "moderators" && (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Moderator Management</h2>
                <p className="text-slate-600 mt-1">Add and manage moderator accounts</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Add Moderator Card */}
                <Card className="shadow-md lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Add New Moderator</CardTitle>
                    <CardDescription>Create moderator account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setPage("addModerator")}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Moderator
                    </Button>
                  </CardContent>
                </Card>

                {/* Moderator Statistics */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Total Moderators</CardTitle>
                    <CardDescription>All moderator accounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-blue-600">{moderators.length}</p>
                      <p className="text-slate-600 mt-2">Moderators</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Moderators */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Active Moderators</CardTitle>
                    <CardDescription>Currently active</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-green-600">
                        {moderators.filter(m => m.isActive).length}
                      </p>
                      <p className="text-slate-600 mt-2">Active</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-xl font-semibold text-slate-800 mb-4">All Moderators</h3>

              {loadingModerators ? (
                <div className="text-center py-12">
                  <p className="text-slate-600">Loading moderators...</p>
                </div>
              ) : moderators.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600">No moderators added yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {moderators.map((moderator) => (
                    <Card key={moderator.id} className="shadow-md">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800">{moderator.fullName}</h3>
                            <p className="text-slate-600 mt-1">@{moderator.username}</p>
                            <p className="text-slate-500 text-sm mt-1">📧 {moderator.email}</p>
                            {moderator.department && (
                              <p className="text-slate-500 text-sm mt-1">🏢 {moderator.department}</p>
                            )}
                            <div className="mt-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                moderator.isActive 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {moderator.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleToggleModeratorStatus(moderator.id, moderator.isActive)}
                              variant="outline"
                              size="sm"
                            >
                              {moderator.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              onClick={() => handleDeleteModerator(moderator.id)}
                              variant="destructive"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Add Moderator Page */}
          {page === "addModerator" && (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Add Moderator</h2>
                <p className="text-slate-600 mt-1">Create a new moderator account</p>
              </div>

              {showSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg shadow-sm">
                  <p className="font-medium">Moderator added successfully!</p>
                </div>
              )}

              <Card className="shadow-md">
                <CardContent className="p-6">
                  <form onSubmit={handleAddModerator} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="modUsername">Username <span className="text-red-500">*</span></Label>
                      <Input
                        id="modUsername"
                        value={newModerator.username}
                        onChange={(e) => setNewModerator({...newModerator, username: e.target.value})}
                        className={moderatorErrors.username ? "border-red-500" : ""}
                      />
                      {moderatorErrors.username && <p className="text-red-500 text-sm">{moderatorErrors.username}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modEmail">Email <span className="text-red-500">*</span></Label>
                      <Input
                        id="modEmail"
                        type="email"
                        value={newModerator.email}
                        onChange={(e) => setNewModerator({...newModerator, email: e.target.value})}
                        className={moderatorErrors.email ? "border-red-500" : ""}
                      />
                      {moderatorErrors.email && <p className="text-red-500 text-sm">{moderatorErrors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modFullName">Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="modFullName"
                        value={newModerator.fullName}
                        onChange={(e) => setNewModerator({...newModerator, fullName: e.target.value})}
                        className={moderatorErrors.fullName ? "border-red-500" : ""}
                      />
                      {moderatorErrors.fullName && <p className="text-red-500 text-sm">{moderatorErrors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modDepartment">Department <span className="text-red-500">*</span></Label>
                      <select
                        id="modDepartment"
                        value={newModerator.department}
                        onChange={(e) => setNewModerator({...newModerator, department: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          moderatorErrors.department ? "border-red-500" : "border-slate-300"
                        }`}
                      >
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Chemical Engineering">Chemical Engineering</option>
                        <option value="Biotechnology">Biotechnology</option>
                        <option value="Administration">Administration</option>
                      </select>
                      {moderatorErrors.department && <p className="text-red-500 text-sm">{moderatorErrors.department}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modPassword">Password <span className="text-red-500">*</span></Label>
                      <Input
                        id="modPassword"
                        type="password"
                        value={newModerator.password}
                        onChange={(e) => setNewModerator({...newModerator, password: e.target.value})}
                        className={moderatorErrors.password ? "border-red-500" : ""}
                      />
                      {moderatorErrors.password && <p className="text-red-500 text-sm">{moderatorErrors.password}</p>}
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Add Moderator
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
