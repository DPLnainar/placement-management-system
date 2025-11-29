import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Building2, Users, UserPlus, LayoutDashboard, Menu, X, LogOut, Briefcase, UserCog, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Determine role from URL or state
  const role = location.state?.role || "admin";
  const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);

  const handleLogout = () => {
    navigate("/");
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: `/${role}/dashboard`,
    },
    {
      id: "view-jobs",
      label: "View Jobs",
      icon: Building2,
      path: `/${role}/view-jobs`,
    },
    {
      id: "add-job",
      label: "Add Job",
      icon: Briefcase,
      path: `/${role}/add-job`,
      section: "Job"
    },
    {
      id: "moderators",
      label: "Moderators",
      icon: UserCog,
      path: `/${role}/moderators`,
    }
  ];

  const isActive = (path) => location.pathname === path;

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
              <p className="text-xs text-slate-400">{roleTitle} Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-6">
          {/* Dashboard */}
          <div>
            <button 
              onClick={() => navigate(menuItems[0].path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(menuItems[0].path) ? "bg-blue-600 text-white" : "hover:bg-slate-700"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* View Jobs */}
          <div>
            <button 
              onClick={() => navigate(menuItems[1].path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(menuItems[1].path) ? "bg-blue-600 text-white" : "hover:bg-slate-700"
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span>View Jobs</span>
            </button>
          </div>

          {/* Job Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4">
              Job
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate(menuItems[2].path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(menuItems[2].path) ? "bg-blue-600 text-white" : "hover:bg-slate-700"
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span>Add Job</span>
              </button>
            </div>
          </div>

          {/* Other Options */}
          <div>
            <div className="space-y-2">
              <button
                onClick={() => navigate(menuItems[3].path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(menuItems[3].path) ? "bg-blue-600 text-white" : "hover:bg-slate-700"
                }`}
              >
                <UserCog className="w-5 h-5" />
                <span>Moderators</span>
              </button>
            </div>
          </div>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
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
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-3xl font-bold text-slate-800">
              Welcome, {roleTitle}! 👋
            </h2>
            <p className="text-slate-600 mt-2">
              Manage your placement portal from this dashboard
            </p>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Total Jobs</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">24</h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Active Moderators</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">8</h3>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCog className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Total Students</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">156</h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Welcome to Placement Portal
              </h3>
              <p className="text-slate-600 mb-6">
                Manage job postings, track placements, and coordinate with moderators all in one place.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => navigate(`/${role}/view-jobs`)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center space-x-2"
                >
                  <Building2 className="w-5 h-5" />
                  <span>View Job</span>
                </button>
                <button
                  onClick={() => navigate(`/${role}/add-job`)}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center space-x-2"
                >
                  <Briefcase className="w-5 h-5" />
                  <span>Add Job</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
