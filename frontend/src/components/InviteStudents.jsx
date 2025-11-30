import React, { useState, useEffect } from 'react';
import { invitationAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Alert from './Alert';
import { LoadingSpinner } from './LoadingSpinner';
import { Mail, Upload, Copy, RefreshCw, X, CheckCircle, Clock, XCircle, Send } from 'lucide-react';

export default function InviteStudents({ userDepartment }) {
  const [activeTab, setActiveTab] = useState('single');
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Single invite form
  const [singleForm, setSingleForm] = useState({
    email: '',
    fullName: '',
    rollNumber: '',
    department: userDepartment || ''
  });

  // Bulk invite
  const [bulkData, setBulkData] = useState('');
  const [bulkResults, setBulkResults] = useState(null);

  useEffect(() => {
    if (userDepartment) {
      setSingleForm(prev => ({ ...prev, department: userDepartment }));
    }
  }, [userDepartment]);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchInvitations();
    }
  }, [activeTab]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationAPI.getAll();
      setInvitations(response.data.data.invitations || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load invitations' });
    } finally {
      setLoading(false);
    }
  };

  const handleSingleInvite = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });

      const response = await invitationAPI.create(singleForm);
      
      setMessage({ 
        type: 'success', 
        text: `Invitation sent successfully to ${singleForm.email}!` 
      });

      // Reset form
      setSingleForm({
        email: '',
        fullName: '',
        rollNumber: '',
        department: userDepartment || ''
      });

      // Show registration link
      if (response.data.data.registrationLink) {
        navigator.clipboard.writeText(response.data.data.registrationLink);
        alert(`Registration link copied to clipboard:\n${response.data.data.registrationLink}`);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send invitation' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkInvite = async () => {
    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });
      setBulkResults(null);

      // Parse CSV data
      const lines = bulkData.trim().split('\n');
      const invitations = [];

      for (let i = 1; i < lines.length; i++) { // Skip header
        const [email, fullName, rollNumber, department] = lines[i].split(',').map(s => s.trim());
        if (email && fullName && department) {
          invitations.push({ email, fullName, rollNumber, department });
        }
      }

      if (invitations.length === 0) {
        setMessage({ type: 'error', text: 'No valid invitations found in the data' });
        return;
      }

      const response = await invitationAPI.createBulk({ invitations });
      setBulkResults(response.data.data);
      
      setMessage({ 
        type: 'success', 
        text: `Bulk invite complete! ${response.data.data.successful} successful, ${response.data.data.failed} failed, ${response.data.data.skipped} skipped.` 
      });

      setBulkData('');
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to process bulk invitations' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (id) => {
    try {
      await invitationAPI.resend(id);
      setMessage({ type: 'success', text: 'Invitation email resent successfully' });
      fetchInvitations();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to resend invitation' });
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return;
    
    try {
      await invitationAPI.cancel(id);
      setMessage({ type: 'success', text: 'Invitation cancelled successfully' });
      fetchInvitations();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel invitation' });
    }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    setMessage({ type: 'success', text: 'Registration link copied to clipboard!' });
  };

  const downloadTemplate = () => {
    const template = 'email,fullName,rollNumber,department\nstudent@example.com,John Doe,CS001,Computer Science\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_invite_template.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite Students</CardTitle>
          <CardDescription>
            Send registration invitations to students via email
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'single'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Mail className="inline mr-2 h-4 w-4" />
              Single Invite
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'bulk'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Upload className="inline mr-2 h-4 w-4" />
              Bulk Invite
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'manage'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Send className="inline mr-2 h-4 w-4" />
              Manage Invitations
            </button>
          </div>

          {message.text && (
            <Alert type={message.type} className="mb-4" message={message.text} />
          )}

          {/* Single Invite Tab */}
          {activeTab === 'single' && (
            <form onSubmit={handleSingleInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={singleForm.email}
                    onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                    placeholder="student@example.com"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={singleForm.fullName}
                    onChange={(e) => setSingleForm({ ...singleForm, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    value={singleForm.rollNumber}
                    onChange={(e) => setSingleForm({ ...singleForm, rollNumber: e.target.value })}
                    placeholder="CS001"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={singleForm.department}
                    onChange={(e) => setSingleForm({ ...singleForm, department: e.target.value })}
                    placeholder="Computer Science"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Bulk Invite Tab */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Paste CSV Data</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    Download Template
                  </Button>
                </div>
                <textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder="email,fullName,rollNumber,department&#10;student@example.com,John Doe,CS001,Computer Science"
                  className="w-full h-48 p-3 border rounded-md font-mono text-sm"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: email, fullName, rollNumber, department (one student per line)
                </p>
              </div>

              <Button
                onClick={handleBulkInvite}
                disabled={submitting || !bulkData}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Send Bulk Invitations
                  </>
                )}
              </Button>

              {bulkResults && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Results:</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-green-600">✓ Successful: {bulkResults.successful}</p>
                    <p className="text-yellow-600">⊗ Skipped: {bulkResults.skipped}</p>
                    <p className="text-red-600">✗ Failed: {bulkResults.failed}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manage Invitations Tab */}
          {activeTab === 'manage' && (
            <div>
              {loading ? (
                <LoadingSpinner />
              ) : invitations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No invitations found</p>
              ) : (
                <div className="space-y-3">
                  {invitations.map((inv) => (
                    <InvitationCard
                      key={inv._id}
                      invitation={inv}
                      onResend={handleResend}
                      onCancel={handleCancel}
                      onCopyLink={copyLink}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvitationCard({ invitation, onResend, onCancel, onCopyLink }) {
  const getStatusBadge = () => {
    switch (invitation.status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock size={12} /> Pending
        </span>;
      case 'registered':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle size={12} /> Registered
        </span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle size={12} /> Expired
        </span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 flex items-center gap-1">
          <X size={12} /> Cancelled
        </span>;
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{invitation.fullName}</h4>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-600">{invitation.email}</p>
          <p className="text-xs text-gray-500">
            {invitation.rollNumber && `${invitation.rollNumber} • `}
            {invitation.department}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Created: {new Date(invitation.createdAt).toLocaleDateString()}
            {invitation.emailSent && ` • Email sent: ${new Date(invitation.emailSentAt).toLocaleDateString()}`}
          </p>
        </div>

        <div className="flex gap-2">
          {invitation.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCopyLink(invitation.registrationLink)}
                title="Copy registration link"
              >
                <Copy size={14} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResend(invitation._id)}
                title="Resend email"
              >
                <RefreshCw size={14} />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onCancel(invitation._id)}
                title="Cancel invitation"
              >
                <X size={14} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
