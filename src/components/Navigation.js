import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Navigation.css';

// Import des icônes SVG
import { ReactComponent as PomodoroIcon } from '../assets/icons/pomodoro.svg';
import { ReactComponent as ChartIcon } from '../assets/icons/chart.svg';
import { ReactComponent as HabitsIcon } from '../assets/icons/habits.svg';
import { ReactComponent as EisenhowerIcon } from '../assets/icons/eisenhower.svg';

const Navigation = () => {
  return (
    <nav className="navigation">
      <NavLink to="/pomodoro" className="nav-item">
        <PomodoroIcon className="nav-icon" />
        <span>Pomodoro</span>
      </NavLink>
      <NavLink to="/chart" className="nav-item">
        <ChartIcon className="nav-icon" />
        <span>Chart</span>
      </NavLink>
      <NavLink to="/habits" className="nav-item">
        <HabitsIcon className="nav-icon" />
        <span>Habits</span>
      </NavLink>
      <NavLink to="/eisenhower" className="nav-item">
        <EisenhowerIcon className="nav-icon" />
        <span>Eisenhower</span>
      </NavLink>
    </nav>
  );
};

export default Navigation;
