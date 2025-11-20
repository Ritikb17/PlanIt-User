import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import recNotification from '../assets/sounds/notification/recNotification.mp3';
import './Navbar.css';

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [glbSocket, setGlbSocket] = useState();
  const [totalNewNotification, setTotalNewNotification] = useState();
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  const navigate = useNavigate();

  // ✅ Fetch the user's profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const meRes = await axios.get('http://localhost:5000/api/profile/get-profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const username = meRes.data.username;
        if (!username) return;

        const picRes = await axios.get(
          `http://localhost:5000/api/picture/my-profile-picture`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
          }
        );

        const imageUrl = URL.createObjectURL(picRes.data);
        setProfilePicUrl(imageUrl);
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    fetchProfilePicture();

    // Cleanup the object URL on unmount
    return () => {
      if (profilePicUrl) URL.revokeObjectURL(profilePicUrl);
    };
  }, []);

  // ✅ Socket.io setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }

    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    setGlbSocket(socket);

    socket.on('connect', () => {
      const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;
      socket.emit('join-notification', { userId });
    });

    socket.on('join-success', (data) => console.log('Joined notification room:', data.eventId));
    socket.on('join-error', (error) => console.error('Failed to join room:', error.message));

    socket.on('new-notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      const audio = new Audio(recNotification);
      audio.play();
    });

    socket.emit('get-notification', {}, (response) => {
      if (response.success) {
        setNotifications(response.notifications[0].notification);
        setTotalNewNotification(response.totalNewNotifications);
      } else console.error('Error fetching notifications:', response.error);
    });

    socket.on('connect_error', (err) => console.error('Connection error:', err.message));

    return () => {
      socket.off('new-notification');
      socket.off('join-success');
      socket.off('join-error');
      socket.disconnect();
    };
  }, []);

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const settingsRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsProfileOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target))
        setIsNotificationsOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(event.target))
        setIsSettingsOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target))
        setIsSearchVisible(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') return setSearchResults([]);

    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:5000/api/other/search-user/${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(response.data.result);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // ✅ Fixed: Simplified user navigation function
  const handleUserClick = (username) => {
    setIsSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/profile/${username}`);
  };

  const markNotification = () => {
    const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;
    glbSocket.emit('set-notification-isSeen', { userId }, () => {
      glbSocket.emit('get-notification', {}, (response) => {
        if (response.success) {
          setNotifications(response.notifications[0].notification);
          setTotalNewNotification(response.totalNewNotifications);
        }
      });
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNotificationClick = (type) => {
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

  const handleBlockUser = () => navigate('/block-users');

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          SocialApp
        </Link>
      </div>

      <div className="navbar-right">
        <Link to="/" className="navbar-icon" title="Home">
          <i className="fas fa-home"></i>
        </Link>
        <Link to="/channels" className="navbar-icon" title="Groups">
          <i className="fas fa-users"></i>
        </Link>
        <Link to="/followers" className="navbar-icon" title="Followers">
          <i className="fas fa-user-friends"></i>
        </Link>
        <Link to="/events" className="navbar-icon" title="Events">
          <i className="fas fa-calendar-alt"></i>
        </Link>

        {/* 🔍 Search */}
        <div className="navbar-icon" onClick={() => setIsSearchVisible(!isSearchVisible)}>
          <i className="fas fa-search"></i>
        </div>

        {isSearchVisible && (
          <div className="search-form" ref={searchRef}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="search-result-item"
                    onClick={() => handleUserClick(user.username)} // ✅ Use the simplified function
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

        {/* 🔔 Notifications */}
        <div className="notifications-dropdown" ref={notificationsRef}>
          <div
            className="navbar-icon"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <i className="fas fa-bell" onClick={markNotification}></i>
            {totalNewNotification > 0 && (
              <span className="notification-badge">{totalNewNotification}</span>
            )}
          </div>
          {isNotificationsOpen && (
            <div className="dropdown-menu">
              {notifications.length > 0 ? (
                notifications.map((n, index) => (
                  <div
                    key={index}
                    className="dropdown-item"
                    onClick={() => handleNotificationClick(n.type)}
                  >
                    {n.message}
                  </div>
                ))
              ) : (
                <div className="dropdown-item">No new notifications</div>
              )}
            </div>
          )}
        </div>

        {/* ⚙️ Settings */}
        <div className="settings-dropdown" ref={settingsRef}>
          <div
            className="navbar-icon"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <i className="fas fa-cog"></i>
          </div>
          {isSettingsOpen && (
            <div className="dropdown-menu">
              <Link to="/block-users" className="dropdown-item">
                <i className="fas fa-ban"></i> Block User
              </Link>
            </div>
          )}
        </div>

        {/* 👤 Profile Dropdown */}
        <div className="profile-dropdown" ref={dropdownRef}>
          <img
            src={profilePicUrl || 'https://via.placeholder.com/40'}
            alt="Profile"
            className="profile-image"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          />
          {isProfileOpen && (
            <div className="dropdown-menu">
              <Link to="/profile" className="dropdown-item">
                <i className="fas fa-user"></i> Profile
              </Link>
              <div className="dropdown-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;