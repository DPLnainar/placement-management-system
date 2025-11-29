import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/AdminDashboard';
import ModeratorDashboard from './components/ModeratorDashboard';
import StudentDash from './components/StudentDash';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CreateJob from './components/CreateJob';
import Setup from './components/Setup';
import './App.css';

// Dashboard Router Component
function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === 'superadmin') {
    return <SuperAdminDashboard />;
  } else if (user?.role === 'admin') {
    return <AdminDashboard />;
  } else if (user?.role === 'moderator') {
    return <ModeratorDashboard />;
  } else if (user?.role === 'student') {
    return <StudentDash />;
  }

  return <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/setup" element={<Setup />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-job"
            element={
              <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                <CreateJob />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to dashboard if authenticated, otherwise to login */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
