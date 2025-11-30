import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogIn, Eye, EyeOff, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

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
      
      // Handle different response structures
      const resData = response.data.data || response.data;
      const userInfo = resData.user;
      const tokenInfo = resData.token;
      
      if (!userInfo || !tokenInfo) {
        throw new Error('Invalid login response from server');
      }
      
      // Store user data with college information (handle null college for superadmin)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Lock className="h-12 w-12 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl text-center">College Placement System</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </>
              )}
            </Button>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Test Credentials:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Admin: <code className="bg-white px-1 rounded">admin_tu</code> / <code className="bg-white px-1 rounded">admin123</code></div>
                <div>• Moderator: <code className="bg-white px-1 rounded">mod_tu</code> / <code className="bg-white px-1 rounded">mod123</code></div>
                <div>• Student: <code className="bg-white px-1 rounded">student1_tu</code> / <code className="bg-white px-1 rounded">student123</code></div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
