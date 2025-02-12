import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';

// Import components
import SplashScreen from './components/SplashScreen';
import LoadingSpinner from './components/LoadingSpinner'; // Import your LoadingSpinner component

// Import pages
import Home from './pages/Home';
import Events from './pages/Events';
import Games from './pages/Games';
import ChallengeDetails from './pages/ChallengeDetails';
import Create from './pages/Create';
import Leaderboard from './pages/Leaderboard';
import MyEvents from './pages/MyEvents';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Help from './pages/Help';
import Referral from './pages/Referral';
import Wallet from './pages/Wallet';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import SignIn from './pages/SignIn';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  const { ready, authenticated } = usePrivy();
  const [showSplash, setShowSplash] = useState(true);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!showSplash) {
      // Simulate a delay for the loading spinner
      const loadingTimer = setTimeout(() => {
        setShowLoading(false);
      }, 3000); // Display loading spinner for 3 seconds

      return () => clearTimeout(loadingTimer);
    }
  }, [showSplash]);


  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => {
          setShowSplash(false);
          setShowLoading(true);
        }} />
      ) : showLoading ? (
        <div className="min-h-screen bg-[#1a1b2e] flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/challenge/:id" element={<ChallengeDetails />} />
            <Route
              path="/create"
              element={authenticated ? <Create /> : <SignIn />}
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route
              path="/myevents"
              element={authenticated ? <MyEvents /> : <SignIn />}
            />
            <Route
              path="/profile"
              element={authenticated ? <Profile /> : <SignIn />}
            />
            <Route
              path="/settings/profile"
              element={authenticated ? <ProfileSettings /> : <SignIn />}
            />
            <Route
              path="/settings"
              element={authenticated ? <Settings /> : <SignIn />}
            />
            <Route
              path="/settings/privacy"
              element={authenticated ? <Privacy /> : <SignIn />}
            />
            <Route path="/help" element={<Help />} />
            <Route
              path="/referral"
              element={authenticated ? <Referral /> : <SignIn />}
            />
            <Route
              path="/wallet"
              element={authenticated ? <Wallet /> : <SignIn />}
            />
            <Route
              path="/notifications"
              element={authenticated ? <Notifications /> : <SignIn />}
            />
            <Route
              path="/messages"
              element={authenticated ? <Messages /> : <SignIn />}
            />
            <Route
              path="/signin"
              element={!authenticated ? <SignIn /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin"
              element={authenticated ? <AdminDashboard /> : <SignIn />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      )}
    </>
  );
};

export default App;
