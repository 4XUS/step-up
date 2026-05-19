import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import POMODORO from './pages/POMODORO';
import CHART from './pages/CHART';
import HABITS from './pages/HABITS';
import EISENHOWER from './pages/EISENHOWER';
import Login from './components/Login';
import Signup from './components/Signup';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles/App.css';
import './styles/Auth.css';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const location = useLocation();
  const showNavigation = location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/signup';

  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Home />} />
          <Route path="/pomodoro" element={
            <PrivateRoute>
              <POMODORO />
            </PrivateRoute>
          } />
          <Route path="/chart" element={
            <PrivateRoute>
              <CHART />
            </PrivateRoute>
          } />
          <Route path="/habits" element={
            <PrivateRoute>
              <HABITS />
            </PrivateRoute>
          } />
          <Route path="/eisenhower" element={
            <PrivateRoute>
              <EISENHOWER />
            </PrivateRoute>
          } />
        </Routes>
      </main>
      {showNavigation && <Navigation />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
