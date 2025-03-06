import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import './Navbar.css'; // Import the CSS file

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* App Name */}
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          SocialApp
        </Link>
      </div>

      {/* Icons */}
      <div className="navbar-right">
        {/* Home Icon */}
        <Link to="/" className="navbar-icon">
          <i className="fas fa-home"></i>
        </Link>

        {/* Friends Icon */}
        <Link to="/groups" className="navbar-icon">
          <i className="fas fa-user-friends"></i>
        </Link>
        <Link to="/events" className="navbar-icon">
  <i className="fas fa-calendar-alt"></i> {/* Calendar icon */}
</Link>

        {/* Message Icon */}
        <Link to="/chat" className="navbar-icon">
          <i className="fas fa-calender"></i>
        </Link>
      
        <Link to="/followers">Followers</Link>
        {/* Message Icon */}
        <Link to="/chat" className="navbar-icon">
        <i className="fas fa-comment-dots"></i>
        </Link>
        

        {/* Profile Image with Dropdown */}
        <div className="profile-dropdown">
          <img
            src="https://via.placeholder.com/40" // Replace with your profile image URL
            alt="Profile"
            className="profile-image"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          />
          {isProfileOpen && (
            <div className="dropdown-menu">
              <Link to="/profile" className="dropdown-item">
                <i className="fas fa-user"></i> Profile
              </Link>
              <Link to="/settings" className="dropdown-item">
                <i className="fas fa-cog"></i> Settings
              </Link>
              <Link to="/logout" className="dropdown-item">
                <i className="fas fa-sign-out-alt"></i> Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;