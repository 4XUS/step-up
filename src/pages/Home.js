import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as PomodoroIcon } from '../assets/icons/pomodoro.svg';
import { ReactComponent as ChartIcon } from '../assets/icons/chart.svg';
import { ReactComponent as HabitsIcon } from '../assets/icons/habits.svg';
import { ReactComponent as EisenhowerIcon } from '../assets/icons/eisenhower.svg';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import logo from '../assets/images/logo.jpg';
import '../styles/Home.css';

const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [logoutMessage, setLogoutMessage] = useState('');
  const navigate = useNavigate();

  const tools = [
    { icon: PomodoroIcon, name: 'POMODORO', path: '/pomodoro' },
    { icon: ChartIcon, name: 'CHART', path: '/chart' },
    { icon: HabitsIcon, name: 'HABITS', path: '/habits' },
    { icon: EisenhowerIcon, name: 'EISENHOWER', path: '/eisenhower' },
  ];

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLogoutMessage('Vous êtes déconnecté.');
      setTimeout(() => setLogoutMessage(''), 3000); // Clear message after 3 seconds
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="home">
      <div className="home-content">
        <img src={logo} alt="Step Up Logo" className="home-logo" />
        
        {logoutMessage && <div className="logout-message">{logoutMessage}</div>}
        
        {auth.currentUser ? (
          <div className="auth-status">
            <span>Connecté en tant que {auth.currentUser.email}</span>
            <button onClick={handleLogout} className="auth-button logout">
              Se déconnecter
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="auth-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
            />
            <button type="submit" className="auth-button">
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="switch-auth"
            >
              {isLogin ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </button>
            {error && <div className="auth-error">{error}</div>}
          </form>
        )}

        <div className="tools-grid">
          {tools.map(({ icon: Icon, name, path }) => (
            <button
              key={path}
              className="tool-button"
              onClick={() => navigate(path)}
            >
              <Icon className="tool-icon" />
              <span className="tool-name">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
