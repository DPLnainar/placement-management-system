import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { UserCircle, Users, GraduationCap, Shield } from 'lucide-react';

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  const roles = [
    {
      title: 'Student',
      description: 'View and apply for job opportunities',
      icon: GraduationCap,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      path: '/login/student'
    },
    {
      title: 'Moderator',
      description: 'Manage students and view applications',
      icon: Users,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      path: '/login/moderator'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <UserCircle className="h-16 w-16 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">College Placement System</h1>
          <p className="text-lg text-gray-600">Select your role to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.title}
                className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105"
                onClick={() => navigate(role.path)}
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 mx-auto`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-center">{role.title}</CardTitle>
                  <CardDescription className="text-center text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className={`w-full bg-gradient-to-r ${role.color} ${role.hoverColor} text-white`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(role.path);
                    }}
                  >
                    Continue as {role.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gray-50 border-2 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Administrator Access</h3>
                  <p className="text-sm text-gray-600">Manage the entire placement system</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
                onClick={() => navigate('/login/admin')}
              >
                Admin Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
