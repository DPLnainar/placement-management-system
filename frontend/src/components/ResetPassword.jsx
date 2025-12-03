import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    score: 0,
    errors: []
  });

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid or missing reset token');
    }
  }, [token]);

  useEffect(() => {
    validatePassword(formData.password);
  }, [formData.password]);

  const validatePassword = (pwd) => {
    const errors = [];
    let score = 0;

    // Length check
    if (pwd.length >= 8) {
      score += 20;
    } else {
      errors.push('At least 8 characters');
    }

    // Uppercase check
    if (/[A-Z]/.test(pwd)) {
      score += 20;
    } else {
      errors.push('One uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(pwd)) {
      score += 20;
    } else {
      errors.push('One lowercase letter');
    }

    // Number check
    if (/[0-9]/.test(pwd)) {
      score += 20;
    } else {
      errors.push('One number');
    }

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      score += 20;
    } else {
      errors.push('One special character');
    }

    setPasswordStrength({
      isValid: errors.length === 0,
      score,
      errors
    });
  };

  const getStrengthColor = () => {
    if (passwordStrength.score < 40) return 'bg-red-500';
    if (passwordStrength.score < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength.score < 40) return 'Weak';
    if (passwordStrength.score < 80) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password strength
    if (!passwordStrength.isValid) {
      setError('Password does not meet strength requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({
        token,
        newPassword: formData.password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to reset password';
      
      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(', '));
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Invalid Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                {error || 'The reset link may have expired or been used already.'}
              </p>
            </div>
            <Link to="/forgot-password">
              <Button className="w-full">Request New Reset Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been reset successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                You can now login with your new password. Redirecting to login page...
              </p>
            </div>
            <Link to="/">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Lock className="h-12 w-12 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  className="pr-10"
                  autoFocus
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

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Password Strength:</span>
                  <span className={`font-semibold ${passwordStrength.score >= 80 ? 'text-green-600' : passwordStrength.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {getStrengthText()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
                {passwordStrength.errors.length > 0 && (
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold">Requirements:</p>
                    <ul className="list-none space-y-0.5">
                      {passwordStrength.errors.map((err, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !passwordStrength.isValid || formData.password !== formData.confirmPassword}
            >
              {loading ? (
                'Resetting...'
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" /> Reset Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
