import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css'; // Import the CSS file

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // State for notifications dropdown
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State for settings dropdown
  const [searchQuery, setSearchQuery] = useState('');

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/user/get-notification", {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Use the token from localStorage
          },
        });

        // Assuming the response data has a structure like { notification: { notification: [...] } }
        const fetchedNotifications = response.data.notification[0].notification;
        setNotifications(fetchedNotifications);

        console.log("NOTIFICATIONS:", fetchedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  // Refs for dropdown menus
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const settingsRef = useRef(null);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search logic here, e.g., redirect to a search results page or filter content
    console.log('Search Query:', searchQuery);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      // Close notifications dropdown
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      // Close settings dropdown
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login'; // Redirect after logout
  };

  // Handle notification click
  const handleNotificationClick = (type) => {
    window.location.href = 'http://localhost:3000/followers';
  };

  // Handle block user
  const handleBlockUser = () => {
   window.location.href ='http://localhost:3000/block-users'
  };

  // Handle privacy settings
  const handlePrivacySettings = () => {
    alert('Privacy Settings functionality goes here.');
  };

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
          <i className="fas fa-users"></i>
        </Link>

        {/* Followers Icon */}
        <Link to="/followers" className="navbar-icon" title="Followers">
          <i className="fas fa-user-friends"></i>
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

        {/* Notifications Icon with Dropdown */}
        <div className="notifications-dropdown" ref={notificationsRef}>
          <div
            className="navbar-icon"
            title="Notifications"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <i className="fas fa-bell"></i>
            {/* Notification Badge */}
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </div>
          {isNotificationsOpen && (
            <div className="dropdown-menu">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="dropdown-item"
                    onClick={() => handleNotificationClick(notification.type)}
                  >
                    {notification.message}
                  </div>
                ))
              ) : (
                <div className="dropdown-item">No new notifications</div>
              )}
            </div>
          )}
        </div>

        {/* Settings Icon with Dropdown */}
        <div className="settings-dropdown" ref={settingsRef}>
          <div
            className="navbar-icon"
            title="Settings"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <i className="fas fa-cog"></i>
          </div>
          {isSettingsOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={handleBlockUser}>
                <i className="fas fa-ban"></i> Block User
              </div>
              <div className="dropdown-item" onClick={handlePrivacySettings}>
                <i className="fas fa-lock"></i> Privacy Settings
              </div>
              <Link to="/theme" className="dropdown-item">
                <i className="fas fa-palette"></i> Theme
              </Link>
              <Link to="/help" className="dropdown-item">
                <i className="fas fa-question-circle"></i> Help
              </Link>
            </div>
          )}
        </div>

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
             
              <Link to="/logout" className="dropdown-item" onClick={handleLogout}>
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