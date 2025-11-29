import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Building2, Users, LayoutDashboard, Menu, X, LogOut, Briefcase, UserCog, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";

function PlacementGraph() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Determine role from URL or state
  const role = location.state?.role || "admin";
  const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);

  // Department-wise placement data
  const departmentData = [
    { department: "Computer Science", placed: 45, total: 50, percentage: 90 },
    { department: "Information Technology", placed: 38, total: 45, percentage: 84 },
    { department: "Electronics & Communication", placed: 30, total: 40, percentage: 75 },
    { department: "Electrical Engineering", placed: 25, total: 35, percentage: 71 },
    { department: "Mechanical Engineering", placed: 28, total: 42, percentage: 67 },
    { department: "Civil Engineering", placed: 20, total: 35, percentage: 57 },
  ];

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
      id: "placement-graph",
      label: "Placement Graph",
      icon: TrendingUp,
      path: `/${role}/placement-graph`,
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
    },
    {
      id: "view-jobs",
      label: "View Jobs",
      icon: Building2,
      path: `/${role}/view-jobs`,
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

          {/* Placement Graph */}
          <div>
            <button 
              onClick={() => navigate(menuItems[1].path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(menuItems[1].path) ? "bg-blue-600 text-white" : "hover:bg-slate-700"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Placement Graph</span>
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
              <button
                onClick={() => navigate(menuItems[4].path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(menuItems[4].path) ? "bg-blue-600 text-white" : "hover:bg-slate-700"
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>View Jobs</span>
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
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Department-wise Placement Statistics</h1>
                <p className="text-slate-600">View placement rates across all departments</p>
              </div>
            </div>
          </div>

          {/* Department-wise Placement Graph */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              {departmentData.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{dept.department}</span>
                    <span className="text-slate-600">
                      {dept.placed}/{dept.total} ({dept.percentage}%)
                    </span>
                  </div>
                  <div className="relative w-full h-10 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full flex items-center justify-end px-4 text-white text-sm font-semibold transition-all duration-500 ${
                        dept.percentage >= 80
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : dept.percentage >= 70
                          ? "bg-gradient-to-r from-blue-500 to-blue-600"
                          : dept.percentage >= 60
                          ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                          : "bg-gradient-to-r from-red-500 to-red-600"
                      }`}
                      style={{ width: `${dept.percentage}%` }}
                    >
                      {dept.percentage >= 20 && `${dept.percentage}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Overall Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Placed</p>
                      <p className="text-3xl font-bold text-green-700 mt-2">
                        {departmentData.reduce((sum, dept) => sum + dept.placed, 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-700" />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Total Students</p>
                      <p className="text-3xl font-bold text-slate-800 mt-2">
                        {departmentData.reduce((sum, dept) => sum + dept.total, 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-slate-700" />
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Overall Rate</p>
                      <p className="text-3xl font-bold text-blue-700 mt-2">
                        {Math.round(
                          (departmentData.reduce((sum, dept) => sum + dept.placed, 0) /
                            departmentData.reduce((sum, dept) => sum + dept.total, 0)) *
                            100
                        )}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Color Legend</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
                  <span className="text-sm text-slate-600">Excellent (≥80%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
                  <span className="text-sm text-slate-600">Good (70-79%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded"></div>
                  <span className="text-sm text-slate-600">Average (60-69%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded"></div>
                  <span className="text-sm text-slate-600">Needs Improvement (&lt;60%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PlacementGraph;
