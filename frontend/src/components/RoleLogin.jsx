import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Building2, GraduationCap, Shield, UserCog } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";

function RoleLogin() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const roleConfig = {
    student: {
      title: "Student Login",
      icon: GraduationCap,
      color: "bg-blue-600",
      description: "Access your placement opportunities"
    },
    moderator: {
      title: "Moderator Login",
      icon: Shield,
      color: "bg-green-600",
      description: "Manage job postings and applications"
    },
    admin: {
      title: "Admin Login",
      icon: UserCog,
      color: "bg-purple-600",
      description: "Full system administration"
    }
  };

  const config = roleConfig[role] || roleConfig.student;
  const Icon = config.icon;

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");
    
    // Simple authentication logic (customize based on your needs)
    if (role === "admin" && username === "admin" && password === "admin") {
      navigate(`/${role}/dashboard`, { state: { role } });
    } else if (role === "moderator" && username === "moderator" && password === "moderator") {
      navigate(`/${role}/dashboard`, { state: { role } });
    } else if (role === "student" && username === "student" && password === "student") {
      navigate(`/${role}/dashboard`, { state: { role } });
    } else {
      setLoginError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className={`mx-auto w-16 h-16 ${config.color} rounded-full flex items-center justify-center mb-4`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">{config.title}</CardTitle>
          <CardDescription className="text-slate-600">{config.description}</CardDescription>
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
            
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-slate-600 hover:text-slate-800 hover:underline transition-colors"
              >
                ← Back to role selection
              </button>
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
              className={`w-full ${config.color} hover:opacity-90 text-white transition-colors`}
            >
              Login as {role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RoleLogin;
