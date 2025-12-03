import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { authAPI, publicAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogIn, Eye, EyeOff, GraduationCap, Users, Shield, ArrowLeft, Building2, RefreshCw } from 'lucide-react';

export default function RoleLogin() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [captcha, setCaptcha] = useState({ captchaId: '', captchaCode: '' });
  const [captchaInput, setCaptchaInput] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

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

  useEffect(() => {
    fetchColleges();
    fetchCaptcha();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await publicAPI.getColleges();
      console.log('Colleges API Response:', response);
      console.log('Response data:', response.data);
      const collegesData = response.data.data || response.data || [];
      console.log('Colleges to display:', collegesData);
      setColleges(Array.isArray(collegesData) ? collegesData : []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const fetchCaptcha = async () => {
    setLoadingCaptcha(true);
    try {
      const response = await authAPI.getCaptcha();
      const captchaData = response.data.data;
      setCaptcha({
        captchaId: captchaData.captchaId,
        captchaCode: captchaData.captchaCode
      });
      setCaptchaInput('');
    } catch (error) {
      console.error('Error fetching captcha:', error);
      setError('Failed to load captcha. Please refresh the page.');
    } finally {
      setLoadingCaptcha(false);
    }
  };

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
      // Validate captcha input
      if (!captchaInput || captchaInput.trim().length !== 4) {
        setError('Please enter the 4-digit captcha');
        setLoading(false);
        return;
      }

      const loginData = {
        username: formData.username,
        password: formData.password,
        collegeId: selectedCollege || undefined,
        captchaId: captcha.captchaId,
        captchaInput: captchaInput.trim()
      };

      const response = await authAPI.login(loginData);

      const resData = response.data.data || response.data;
      const userInfo = resData.user;
      const tokenInfo = resData.token;

      if (!userInfo || !tokenInfo) {
        throw new Error('Invalid login response from server');
      }

      // Validate role matches (case-insensitive)
      // Allow superadmin to login through admin page
      const userRole = (userInfo.role || '').toLowerCase();
      const expectedRole = (role || '').toLowerCase();

      if (userRole !== expectedRole && !(userRole === 'superadmin' && expectedRole === 'admin')) {
        setError(`Incorrect username or password`);
        setLoading(false);
        fetchCaptcha(); // Refresh captcha on error
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
      fetchCaptcha(); // Refresh captcha on error
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

            {/* College Selection - First Step */}
            <div className="space-y-2">
              <Label htmlFor="college">Select College</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <select
                  id="college"
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required={role !== 'admin'}
                >
                  <option value="">Select your college...</option>
                  {colleges.map((college) => (
                    <option key={college._id || college.id} value={college._id || college.id}>
                      {college.name} ({college.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

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

            {/* Captcha Section */}
            <div className="space-y-2">
              <Label htmlFor="captcha">Security Code</Label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-bold text-2xl tracking-widest select-none">
                      {loadingCaptcha ? '....' : captcha.captchaCode}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={fetchCaptcha}
                      disabled={loadingCaptcha}
                      title="Refresh captcha"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingCaptcha ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <Input
                    id="captcha"
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Enter 4-digit code"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">Enter the 4-digit code shown above</p>
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
              disabled={loading || !formData.username || !formData.password || !captchaInput}
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
