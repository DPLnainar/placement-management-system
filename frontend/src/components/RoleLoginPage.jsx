import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogIn, Eye, EyeOff, GraduationCap, Users, Shield, ArrowLeft } from 'lucide-react';

export default function RoleLogin() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // Redirect if no role specified
  useEffect(() => {
    if (!role || !['student', 'moderator', 'admin'].includes(role.toLowerCase())) {
      navigate('/');
    }
  }, [role, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const roleConfig = {
    student: {
      title: 'Student Login',
      icon: GraduationCap,
      color: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-cyan-100',
      testCreds: { username: 'student1_tu', password: 'student123' }
    },
    moderator: {
      title: 'Moderator Login',
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-emerald-100',
      testCreds: { username: 'mod_tu', password: 'mod123' }
    },
    admin: {
      title: 'Administrator Login',
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-pink-100',
      testCreds: { username: 'admin_tu', password: 'admin123' }
    }
  };

  const config = roleConfig[role] || roleConfig.student;
  const Icon = config.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginData = {
        username: formData.username,
        password: formData.password,
      };
      
      const response = await authAPI.login(loginData);
      
      const resData = response.data.data || response.data;
      const userInfo = resData.user;
      const tokenInfo = resData.token;
      
      if (!userInfo || !tokenInfo) {
        throw new Error('Invalid login response from server');
      }

      // Validate role matches (case-insensitive)
      const userRole = (userInfo.role || '').toLowerCase();
      const expectedRole = (role || '').toLowerCase();
      
      if (userRole !== expectedRole) {
        setError(`Incorrect username or password`);
        setLoading(false);
        return;
      }
      
      const userData = {
        id: userInfo.id || userInfo._id,
        username: userInfo.username,
        email: userInfo.email,
        fullName: userInfo.fullName,
        role: userInfo.role,
        status: userInfo.status,
        department: userInfo.department || null,
        collegeId: userInfo.college?.id || userInfo.college?._id || userInfo.collegeId || null,
        collegeName: userInfo.college?.name || '',
        collegeCode: userInfo.college?.code || '',
      };
      
      login(userData, tokenInfo);
      
      // Navigate to dashboard (single port application)
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${config.bgGradient} p-4`}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit mb-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Role Selection
          </Button>
          <div className="flex items-center justify-center mb-2">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{config.title}</CardTitle>
          <CardDescription className="text-center">
            Sign in to your {role} account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className={`w-full bg-gradient-to-r ${config.color}`}
              disabled={loading || !formData.username || !formData.password}
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In as {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'}
                </>
              )}
            </Button>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Test Credentials:</p>
              <div className="text-xs text-gray-600">
                <code className="bg-white px-1 rounded">{config.testCreds.username}</code> / <code className="bg-white px-1 rounded">{config.testCreds.password}</code>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
