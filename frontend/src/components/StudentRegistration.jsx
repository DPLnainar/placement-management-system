import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invitationAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Alert from './Alert';
import { LoadingSpinner } from './LoadingSpinner';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export default function StudentRegistration() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
    match: false
  });

  // Verify invitation token on mount
  useEffect(() => {
    verifyInvitation();
  }, [token]);

  // Validate password in real-time
  useEffect(() => {
    const { password, confirmPassword } = formData;
    
    setPasswordValidation({
      minLength: password.length >= 6,
      hasNumber: /\d/.test(password),
      hasLetter: /[a-zA-Z]/.test(password),
      match: password.length > 0 && password === confirmPassword
    });
  }, [formData.password, formData.confirmPassword]);

  const verifyInvitation = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await invitationAPI.verify(token);
      setInvitation(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired invitation link');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (!passwordValidation.minLength || !passwordValidation.hasNumber || !passwordValidation.hasLetter) {
      setError('Password does not meet requirements');
      return;
    }

    try {
      setSubmitting(true);
      
      // Register with invitation token
      const response = await authAPI.registerInvited({
        token,
        username: formData.username,
        password: formData.password
      });

      // Auto-login after successful registration
      const { token: authToken, user } = response.data.data;
      login(user, authToken);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert type="error" message={error} />
            <p className="mt-4 text-sm text-gray-600">
              Please contact your placement coordinator for a new invitation link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Complete Your Registration
          </CardTitle>
          <CardDescription>
            Welcome to {invitation?.college?.name || 'Placement Portal'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Invitation Details */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Your Details</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {invitation?.fullName}</p>
              <p><strong>Email:</strong> {invitation?.email}</p>
              {invitation?.rollNumber && (
                <p><strong>Roll Number:</strong> {invitation?.rollNumber}</p>
              )}
              <p><strong>Department:</strong> {invitation?.department}</p>
            </div>
          </div>

          {error && (
            <Alert type="error" className="mb-4" message={error} />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <Label htmlFor="username">
                Choose a Username * <span className="text-xs text-gray-500">(will be used for login)</span>
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                placeholder="e.g., john.doe or johndoe123"
                required
                minLength={3}
                pattern="[a-z0-9._\-]*"
                title="Username can only contain lowercase letters, numbers, dots, underscores, and hyphens"
                disabled={submitting}
                className="lowercase"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 3 characters. Use lowercase letters, numbers, dots, underscores, or hyphens.
              </p>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">Create Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter a strong password"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Requirements */}
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-gray-700">Password must contain:</p>
                <PasswordRequirement
                  met={passwordValidation.minLength}
                  text="At least 6 characters"
                />
                <PasswordRequirement
                  met={passwordValidation.hasLetter}
                  text="At least one letter"
                />
                <PasswordRequirement
                  met={passwordValidation.hasNumber}
                  text="At least one number"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                required
                disabled={submitting}
              />
              {formData.confirmPassword && (
                <PasswordRequirement
                  met={passwordValidation.match}
                  text="Passwords match"
                  className="mt-2"
                />
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                submitting ||
                !formData.username ||
                !passwordValidation.minLength ||
                !passwordValidation.hasNumber ||
                !passwordValidation.hasLetter ||
                !passwordValidation.match
              }
            >
              {submitting ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Creating Account...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-4">
              By registering, you agree to the terms and conditions of the placement portal.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for password requirements
function PasswordRequirement({ met, text, className = '' }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {met ? (
        <CheckCircle size={14} className="text-green-600" />
      ) : (
        <XCircle size={14} className="text-gray-400" />
      )}
      <span className={met ? 'text-green-700' : 'text-gray-600'}>{text}</span>
    </div>
  );
}
