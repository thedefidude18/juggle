import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
import Events from './pages/Events';
import Games from './pages/Games';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Wallet from './pages/Wallet';
import SignIn from './pages/SignIn';
import Create from './pages/Create';
import Referral from './pages/Referral';
import Help from './pages/Help';
import Privacy from './pages/Privacy';
import ChallengeDetails from './pages/ChallengeDetails';
import ProfileSettings from './pages/ProfileSettings';
import AdminDashboard from './pages/AdminDashboard';
import MyEvents from './pages/MyEvents';
import Leaderboard from './pages/Leaderboard';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';

const AppRoutes = () => {
  const { currentUser: authenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/help" element={<Help />} />
      <Route path="/settings/privacy" element={<Privacy />} />
      
      {/* Protected routes */}
      <Route path="/events" element={
        <ProtectedRoute>
          <Events />
        </ProtectedRoute>
      } />
      <Route path="/games" element={
        <ProtectedRoute>
          <Games />
        </ProtectedRoute>
      } />
      <Route path="/myevents" element={
        <ProtectedRoute>
          <MyEvents />
        </ProtectedRoute>
      } />
      <Route path="/challenge/:id" element={
        <ProtectedRoute>
          <ChallengeDetails />
        </ProtectedRoute>
      } />
      <Route path="/create" element={
        <ProtectedRoute>
          <Create />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/settings/profile" element={
        <ProtectedRoute>
          <ProfileSettings />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/referral" element={
        <ProtectedRoute>
          <Referral />
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute>
          <Wallet />
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Leaderboard />
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route path="*" element={<Navigate to="/events" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
