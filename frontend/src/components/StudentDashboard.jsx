import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, TrendingUp, Filter, Lock, Menu, X, LogOut, User, FileText, Award, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import ChangePassword from './ChangePassword';
import ProfileForm from './ProfileForm';
import InternshipForm from './InternshipForm';
import SkillsForm from './SkillsForm';
import ResumeUpload from './ResumeUpload';
import { applicationAPI } from '../services/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs'); // jobs, profile, internships, skills, career
  
  // Student data states
  const [studentProfile, setStudentProfile] = useState({
    isProfileCompleted: false
  });
  const [internships, setInternships] = useState([]);
  const [skills, setSkills] = useState([]);
  const [resume, setResume] = useState(null);

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    loadStudentData();
  }, []);

  const loadStudentData = () => {
    // Load data from localStorage (in production, fetch from backend)
    const savedProfile = localStorage.getItem('studentProfile');
    const savedInternships = localStorage.getItem('internships');
    const savedSkills = localStorage.getItem('skills');
    const savedResume = localStorage.getItem('resume');

    if (savedProfile) setStudentProfile(JSON.parse(savedProfile));
    if (savedInternships) setInternships(JSON.parse(savedInternships));
    if (savedSkills) setSkills(JSON.parse(savedSkills));
    if (savedResume) setResume(JSON.parse(savedResume));
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs?status=active`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await applicationAPI.getAll();
      const applications = response.data;
      const jobIds = new Set(applications.map(app => app.jobId));
      setAppliedJobs(jobIds);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    try {
      await applicationAPI.create({ jobId });
      alert('Application submitted successfully!');
      setAppliedJobs(prev => new Set([...prev, jobId]));
    } catch (error) {
      alert(error.response?.data?.detail || 'Error submitting application');
    } finally {
      setApplyingJobId(null);
    }
  };

  const filteredJobs = filterCategory === 'all' 
    ? jobs 
    : jobs.filter(job => job.jobCategory.toLowerCase().includes(filterCategory.toLowerCase()));

  const categories = ['all', 'software', 'data science', 'hardware', 'networking'];

  if (showChangePassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="student-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-8 h-8 text-blue-600" />
                Student Portal
              </h1>
              <p className="text-slate-600 mt-1">Explore placement opportunities</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Desktop tabs */}
              <div className="hidden lg:flex items-center gap-2">
                <Button 
                  variant={activeTab === 'jobs' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('jobs')}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Jobs
                </Button>
                <Button 
                  variant={activeTab === 'profile' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </Button>
                <Button 
                  variant={activeTab === 'internships' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('internships')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Internships
                </Button>
                <Button 
                  variant={activeTab === 'skills' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('skills')}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Skills & Resume
                </Button>
                <Button 
                  variant={activeTab === 'career' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('career')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Career Path
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowChangePassword(true)}>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
              {/* Burger menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white/50"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile menu dropdown */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 py-4 border-t border-slate-200 space-y-2 bg-white/80 rounded-lg p-2">
              <button
                onClick={() => {
                  setActiveTab('jobs');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'jobs' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-white'}`}
              >
                <Briefcase className="inline-block mr-2 h-4 w-4" />
                Jobs
              </button>
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'profile' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-white'}`}
              >
                <User className="inline-block mr-2 h-4 w-4" />
                My Profile
              </button>
              <button
                onClick={() => {
                  setActiveTab('internships');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'internships' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-white'}`}
              >
                <FileText className="inline-block mr-2 h-4 w-4" />
                Internships
              </button>
              <button
                onClick={() => {
                  setActiveTab('skills');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'skills' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-white'}`}
              >
                <Award className="inline-block mr-2 h-4 w-4" />
                Skills & Resume
              </button>
              <button
                onClick={() => {
                  setActiveTab('career');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'career' ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-white'}`}
              >
                <Target className="inline-block mr-2 h-4 w-4" />
                Career Path
              </button>
              <button
                onClick={() => {
                  setShowChangePassword(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-md text-slate-700 hover:bg-white transition-colors"
              >
                <Lock className="inline-block mr-2 h-4 w-4" />
                Change Password
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <>
            {/* Filter Bar */}
            <div className="py-4 mb-6">
              <div className="filter-bar">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Filter className="w-5 h-5" />
                  Filter by Category:
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      onClick={() => setFilterCategory(category)}
                      variant={filterCategory === category ? "default" : "outline"}
                      className={`capitalize ${filterCategory === category ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Jobs Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card className="job-card-empty">
                <CardContent className="p-16 text-center">
                  <Briefcase className="w-20 h-20 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No Jobs Available</h3>
                  <p className="text-slate-600">Check back later for new opportunities</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => {
                  const isExpired = job.deadline && new Date(job.deadline) < new Date();
                  const isActive = job.status === 'active' && !isExpired;
                  
                  return (
                  <Card key={job.id} className="job-card hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl font-bold text-slate-800 line-clamp-1">
                          {job.companyName}
                        </CardTitle>
                        <Badge className={isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}>
                          {isActive ? 'Active' : 'Closed'}
                        </Badge>
                      </div>
                      <CardDescription className="text-base text-slate-700 font-medium">
                        {job.jobCategory}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                        {job.location}
                      </div>

                      {job.deadline && (
                        <div className="flex items-center text-sm text-slate-600">
                          <span className="font-semibold mr-2">Deadline:</span>
                          <span className={isExpired ? "text-red-600 font-semibold" : ""}>
                            {new Date(job.deadline).toLocaleDateString()} {new Date(job.deadline).toLocaleTimeString()}
                          </span>
                        </div>
                      )}

                      <p className="text-sm text-slate-700 line-clamp-3">
                        {job.jobDescription}
                      </p>

                      {/* Eligibility Badges */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Eligibility Criteria
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            10th: {job.tenthPercentage}%
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            12th: {job.twelfthPercentage}%
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            CGPA: {job.cgpa}
                          </Badge>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Required Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(job.skills).map(([skill, enabled]) => 
                            enabled && skill !== 'others' && (
                              <Badge key={skill} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                {skill.replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                            )
                          )}
                          {job.skills.others && job.otherSkill && (
                            <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                              {job.otherSkill}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button 
                        className="w-full mt-4 transition-colors" 
                        disabled={!isActive || appliedJobs.has(job.id) || applyingJobId === job.id}
                        variant={isActive && !appliedJobs.has(job.id) ? "default" : "secondary"}
                        onClick={() => handleApply(job.id)}
                      >
                        {applyingJobId === job.id 
                          ? 'Submitting...' 
                          : appliedJobs.has(job.id)
                            ? 'Already Applied'
                            : isActive 
                              ? 'Apply Now' 
                              : isExpired 
                                ? 'Application Closed' 
                                : 'Not Available'}
                      </Button>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* My Profile Tab - Read Only for students after first save */}
        {activeTab === 'profile' && (
          <ProfileForm 
            studentData={studentProfile}
            onUpdate={(data) => {
              setStudentProfile(data);
              // In production, save to backend
              localStorage.setItem('studentProfile', JSON.stringify(data));
            }}
          />
        )}

        {/* Internships Tab - Editable */}
        {activeTab === 'internships' && (
          <InternshipForm 
            internships={internships}
            onUpdate={(data) => {
              setInternships(data);
              // In production, save to backend
              localStorage.setItem('internships', JSON.stringify(data));
            }}
          />
        )}

        {/* Skills & Resume Tab - Editable */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <SkillsForm 
              skills={skills}
              onUpdate={(data) => {
                setSkills(data);
                // In production, save to backend
                localStorage.setItem('skills', JSON.stringify(data));
              }}
            />
            <ResumeUpload 
              resumeData={resume}
              onUpdate={(data) => {
                setResume(data);
                // In production, save to backend
                localStorage.setItem('resume', JSON.stringify(data));
              }}
            />
          </div>
        )}

        {/* Career Path Tab */}
        {activeTab === 'career' && (
          <Card>
            <CardHeader>
              <CardTitle>Career Path</CardTitle>
              <CardDescription>Explore career opportunities and growth paths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4 text-slate-800">Recommended Career Paths</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Software Development</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">Full-stack, Frontend, Backend, Mobile Development</p>
                        <Button size="sm" variant="outline">Explore Path</Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Data Science & AI</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">Machine Learning, Data Analytics, AI Engineering</p>
                        <Button size="sm" variant="outline">Explore Path</Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cloud & DevOps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">Cloud Architecture, DevOps Engineering, SRE</p>
                        <Button size="sm" variant="outline">Explore Path</Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cybersecurity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">Security Analyst, Penetration Testing, Security Engineer</p>
                        <Button size="sm" variant="outline">Explore Path</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-800">Career Resources</h3>
                  <div className="space-y-3">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-1">Resume Building Tips</h4>
                        <p className="text-sm text-gray-600">Learn how to create an impressive resume</p>
                      </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-1">Interview Preparation</h4>
                        <p className="text-sm text-gray-600">Master common interview questions and techniques</p>
                      </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-1">Industry Trends</h4>
                        <p className="text-sm text-gray-600">Stay updated with latest technology trends</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
