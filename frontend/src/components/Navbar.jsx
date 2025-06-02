import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Use useNavigate for programmatic navigation
import axios from 'axios';
import io from 'socket.io-client';
import recNotification from '../assets/sounds/notification/recNotification.mp3'
import './Navbar.css'; // Import the CSS file

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // State for notifications dropdown
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State for settings dropdown
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [searchResults, setSearchResults] = useState([]); // State for search results
  const [notifications, setNotifications] = useState([]);
  const [glbSocket, setGlbSocket] = useState();
  const [totalNewNotification, setTotalNewNotification] = useState();

  const navigate = useNavigate(); // Use useNavigate for navigation


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }

    // Initialize socket connection
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'] // Force WebSocket only
    });

    setGlbSocket(socket);
    // Join notification room on connection
    socket.on('connect', () => {
      const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;

      socket.emit('join-notification', { userId });
    });

    // Notification event handlers
    socket.on('join-success', (data) => {
      console.log('Joined notification room:', data.eventId);
    });

    socket.on('join-error', (error) => {
      console.error('Failed to join room:', error.message);
    });

    // Handle incoming notifications
    socket.on('new-notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    // Request initial notifications
    socket.emit('get-notification', {}, (response) => {
      if (response.success) {
        setNotifications(response.notifications[0].notification);
        console.log("success in getting notfication ", response.notifications[0].notification);
        console.log("success in to notfication ", response.totalNewNotifications);
        setTotalNewNotification(response.totalNewNotifications);
      } else {
        console.error('Error fetching notifications:', response.error);
      }
    });



    // Error handling
    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });

    // Cleanup on unmount
    return () => {
      socket.off('new-notification');
      socket.off('join-success');
      socket.off('join-error');
      socket.disconnect();
    };
  }, []); // Empty dependency array to run only once

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
  const markNotification = () => {
    const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;
    glbSocket.emit('set-notification-isSeen', { userId: userId }, (response) => {
    glbSocket.emit('get-notification', {}, (response) => {
      if (response.success) {
        setNotifications(response.notifications[0].notification);
        console.log("success in getting notfication again  ", response.notifications[0].notification);
        setTotalNewNotification(response.totalNewNotifications);
      } else {
        console.error('Error fetching notifications:', response.error);
      }
    });



      // if (response && response.success) {
      //   setNotifications(prevNotifications =>
      //     prevNotifications.map(notification => ({
      //       ...notification,
      //       isSeen: true
      //     }))
      //   );
      // }
    });
  }
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login'); // Redirect after logout
  };

  // Handle notification click
  const handleNotificationClick = (type) => {
    console.log("notification type ", type);

    // Check if socket is available
    if (!glbSocket) {
      console.error('Socket connection not established');
      return;
    }



    // Navigate based on notification type
    switch (type) {
      case 'channel':
        navigate('/channel-requests');
        break;
      case 'post':
        navigate('/');
        break;
      case 'follow':
        navigate('/followers');
        break;
      default:
        console.log('Unknown notification type');
    }
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
            <i className="fas fa-bell" onClick={markNotification}></i>
            {totalNewNotification}
            {/* Notification Badge */}

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