import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Use useNavigate for programmatic navigation
import axios from 'axios';
import './Navbar.css'; // Import the CSS file

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // State for notifications dropdown
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State for settings dropdown
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [searchResults, setSearchResults] = useState([]); // State for search results
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate(); // Use useNavigate for navigation

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

  // Handle search input change
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query); // Update the search query state

    if (query.trim() === '') {
      setSearchResults([]); // Clear search results if the query is empty
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/other/search-user/${query}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSearchResults(response.data.result); // Store the search results
      console.log("SEARCH RESULTS:", response.data.result);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  // Fetch user info when a search result is clicked
  const getUserInfo = async (username) => {
    const token = localStorage.getItem('token');
    console.log("The id is ", username);
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }
    try {
      const userInfo = await axios.get(`http://localhost:5000/api/user/get-user/${username}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("USER INFO IS ", userInfo.data);
      navigate(`/profile/${username}`); // Navigate to the user's profile page
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
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
    navigate('/login'); // Redirect after logout
  };

  // Handle notification click
  const handleNotificationClick = (type) => {
    navigate('/followers'); // Use navigate instead of window.location.href
  };

  // Handle block user
  const handleBlockUser = () => {
    navigate('/block-users'); // Use navigate instead of window.location.href
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
          <div className="search-form">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange} // Update search query on input change
              className="search-input"
              autoFocus
            />
            {/* Display Search Results */}
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="search-result-item"
                    onClick={() => getUserInfo(user.username)} // Use arrow function to avoid immediate invocation
                  >
                    <img
                      src={user.profilePicture || 'https://via.placeholder.com/40'}
                      alt={user.username}
                      className="profile-picture"
                    />
                    <p>{user.username}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
              <Link to="/login" className="dropdown-item" onClick={handleLogout}>
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