import React from 'react';
import HomeButton from './HomeButton';
import '../styles/ToolLayout.css';

const ToolLayout = ({ children }) => {
  return (
    <div className="tool-layout">
      <HomeButton />
      <div className="tool-content">
        {children}
      </div>
    </div>
  );
};

export default ToolLayout;
