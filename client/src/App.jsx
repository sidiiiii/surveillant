import { useState, useEffect } from 'react';
// Force redeploy trigger
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RegisterSchool from './pages/RegisterSchool';
import RegisterParent from './pages/RegisterParent';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import StudentDocuments from './pages/admin/StudentDocuments';
import ParentDashboard from './pages/parent/ParentDashboard';
import Subjects from './pages/admin/Subjects';
import Classes from './pages/admin/Classes';
import PublicHome from './pages/PublicHome';
import PublicStudentView from './pages/PublicStudentView';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/login" />;

  // Superadmin can access anything
  if (user.is_superadmin || user.role === 'super_admin') return children;

  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register-school" element={<RegisterSchool />} />
        <Route path="/register-parent" element={<RegisterParent />} />

        {/* Public Routes */}
        <Route path="/" element={<PublicHome />} />
        <Route path="/public/student/:nni" element={<PublicStudentView />} />


        {/* Admin Routes with Nested Routing */}
        <Route path="/admin/*" element={
          <ProtectedRoute role="admin">
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/settings" element={<AdminSettings />} />
              <Route path="/student/:studentId/documents" element={<StudentDocuments />} />
            </Routes>
          </ProtectedRoute>
        } />

        {/* Parent Routes
        <Route path="/parent/*" element={
          <ProtectedRoute role="parent">
            <ParentDashboard />
          </ProtectedRoute>
        } /> */}

        {/* SuperAdmin Routes */}
        <Route path="/superadmin" element={
          <ProtectedRoute>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } />


      </Routes>
    </Router>
  );
}

export default App;
