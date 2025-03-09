import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Import the CSS file

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Ref for the dropdown menu
  const dropdownRef = useRef(null);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search logic here, e.g., redirect to a search results page or filter content
    console.log('Search Query:', searchQuery);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <Link to="/" className="navbar-icon" title="Home">
          <i className="fas fa-home"></i>
        </Link>

        {/* Friends Icon */}
        <Link to="/groups" className="navbar-icon" title="Groups">
          <i className="fas fa-user-friends"></i>
        </Link>

        {/* Followers Icon */}
        <Link to="/followers" className="navbar-icon" title="Followers">
          <i className="fas fa-users"></i>
        </Link>

        {/* Chat Icon */}
        <Link to="/events" className="navbar-icon" title="Events">
          <i className="fas fa-calendar-alt"></i>
        </Link>

        {/* Search Icon */}
        <div className="navbar-icon" title="Search" onClick={() => setIsSearchVisible(!isSearchVisible)}>
          <i className="fas fa-search"></i>
        </div>

        {/* Search Input (Visible when isSearchVisible is true) */}
        {isSearchVisible && (
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              autoFocus
            />
          </form>
        )}

        {/* Profile Image with Dropdown */}
        <div className="profile-dropdown" ref={dropdownRef}>
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