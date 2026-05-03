import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MedicationPage from './pages/MedicationPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d1a16',
            color: '#e8f5ef',
            border: '1px solid #1e3d2c',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            borderRadius: 12,
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#000' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#000' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout><MedicationPage /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute>
            <DashboardLayout><ReportPage /></DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <DashboardLayout><HistoryPage /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}