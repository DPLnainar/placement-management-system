import React from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Shield, UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: "student",
      title: "Student",
      description: "View and apply for job postings",
      icon: GraduationCap,
      color: "bg-blue-600 hover:bg-blue-700",
      path: "/login/student"
    },
    {
      id: "moderator",
      title: "Moderator",
      description: "Manage job postings and applications",
      icon: Shield,
      color: "bg-green-600 hover:bg-green-700",
      path: "/login/moderator"
    },
    {
      id: "admin",
      title: "Admin",
      description: "Full system access and management",
      icon: UserCog,
      color: "bg-purple-600 hover:bg-purple-700",
      path: "/login/admin"
    }
  ];

  const handleRoleClick = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Placement Portal</h1>
          <p className="text-slate-600">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card 
                key={role.id}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-400"
                onClick={() => handleRoleClick(role.path)}
              >
                <CardHeader className="text-center">
                  <div className={`mx-auto w-20 h-20 ${role.color} rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-2">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className={`w-full ${role.color} text-white transition-colors`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRoleClick(role.path);
                    }}
                  >
                    Continue as {role.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;
