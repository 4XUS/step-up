import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomeButton.css';

const HomeButton = () => {
  const navigate = useNavigate();

  return (
    <button className="home-button" onClick={() => navigate('/')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
};

export default HomeButton;
