import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './DiscoverPage.css'; // Import the CSS file
import Navbar from '../components/Navbar';

const DiscoverPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]); // List of discoverable users
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [page, setPage] = useState(1); // Pagination
  const [hasMore, setHasMore] = useState(true); // Whether more users are available

  // Fetch discoverable users
  const fetchUsers = async (page = 1, search = '') => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, please log in again.');
      setError('No token found, please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/user/discover-users?page=${page}&limit=10&search=${search}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Append new users to the existing list
      if (page === 1) {
        setUsers(response.data.users);
      } else {
        setUsers((prevUsers) => [...prevUsers, ...response.data.users]);
      }

      // Check if there are more users to load
      setHasMore(response.data.users.length > 0);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Fetch users on component mount or when search query changes
  useEffect(() => {
    fetchUsers(1, searchQuery);
  }, [searchQuery]);

  // Handle follow/unfollow actions
  const handleFollow = async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, please log in again.');
      setError('No token found, please log in again.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:5000/api/user/follow-user',
        { userId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the user's follow status in the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isFollowing: true } : user
        )
      );

      alert('Follow request sent successfully.');
    } catch (error) {
      console.error('Error following user:', error);
      alert('Failed to follow user.');
    }
  };

  const handleUnfollow = async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, please log in again.');
      setError('No token found, please log in again.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:5000/api/user/unfollow-user',
        { userId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the user's follow status in the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isFollowing: false } : user
        )
      );

      alert('Unfollowed successfully.');
    } catch (error) {
      console.error('Error unfollowing user:', error);
      alert('Failed to unfollow user.');
    }
  };

  // Handle "Load More" button click
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage, searchQuery);
  };

  return (
    <div>
      <Navbar />

      <div className="discover-page">
        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Users List */}
        <div className="users-list">
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : users.length > 0 ? (
            users.map((user) => (
              <div key={user._id} className="user-card">
                <div className="user-info">
                  <img
                    src={user.profilePicture || 'https://via.placeholder.com/50'}
                    alt={user.name}
                    className="profile-picture"
                  />
                  <div className="user-details">
                    <p className="user-name">{user.name}</p>
                    <p className="user-username">@{user.username}</p>
                  </div>
                </div>
                <div className="user-actions">
                  {user.isFollowing ? (
                    <button
                      className="unfollow-btn"
                      onClick={() => handleUnfollow(user._id)}
                    >
                      Unfollow
                    </button>
                  ) : (
                    <button
                      className="follow-btn"
                      onClick={() => handleFollow(user._id)}
                    >
                      Follow
                    </button>
                  )}
                  <Link to={`/profile/${user._id}`} className="view-profile-btn">
                    View Profile
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p>No users found.</p>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && !isLoading && (
          <button className="load-more-btn" onClick={handleLoadMore}>
            Load More
          </button>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;