import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>🩸 BloodConnect</h1>
        </div>
        
        <nav className="nav">
          <div className="user-info">
            <span className="user-name">Welcome, {user?.name}</span>
            <span className="user-type">{user?.type === 'user' ? 'Donor' : 'Hospital'}</span>
          </div>
          
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;