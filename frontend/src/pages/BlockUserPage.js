import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './BlockUserPage.css';
import Navbar from '../components/Navbar';
import axios from 'axios';

const BlockedUsersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]); // Initialize with empty array
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Fetch blocked users when the component mounts
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage
      if (!token) {
        console.error('No token found, please log in again.');
        setError('No token found, please log in again.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          'http://localhost:5000/api/user/get-block-users?page=1&limit=8',
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, // Use the token from localStorage
            },
          }
        );

        // Update the state with the fetched data
        setBlockedUsers(response.data.blockUser || []); // Fallback to empty array if undefined
        setIsLoading(false); // Set loading to false
      } catch (error) {
        console.error('Error fetching blocked users:', error);
        setError(error.message); // Set error state
        setIsLoading(false); // Set loading to false
      }
    };

    fetchBlockedUsers();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle unblocking a user
  const handleUnblockUser = async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, please log in again.');
      setError('No token found, please log in again.');
      return;
    }

    try {
      await axios.put(
        'http://localhost:5000/api/user/unblock-user',
        { _id: userId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the blocked users list by removing the unblocked user
      setBlockedUsers((prevBlockedUsers) =>
        prevBlockedUsers.filter((user) => user._id !== userId)
      );

      alert('User unblocked successfully.');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user.');
    }
  };

  // Handle removing a user
  const handleRemoveUser = async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, please log in again.');
      setError('No token found, please log in again.');
      return;
    }

    try {
      await axios.put(
        'http://localhost:5000/api/user/remove-user',
        { _id: userId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the blocked users list by removing the user
      setBlockedUsers((prevBlockedUsers) =>
        prevBlockedUsers.filter((user) => user._id !== userId)
      );

      alert('User removed successfully.');
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user.');
    }
  };

  // Filter blocked users based on search query
  const filteredBlockedUsers = blockedUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Navbar />

      <div className="followers-page">
        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search blocked users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Blocked Users Section */}
        <div className="followers-section">
          <h2>Block List</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : filteredBlockedUsers.length > 0 ? (
            <div className="followers-list">
              {filteredBlockedUsers.map((user) => (
                <div key={user._id} className="follower-item">
                  <div className="follower-info">
                    <p>{user.name}</p>
                    <span
                      className={`follow-status ${user.isFollowing ? 'following' : 'not-following'
                        }`}
                    >
                      {user.isFollowing ? 'Following' : 'Not Following'}
                    </span>
                  </div>
                  <div className="follower-actions">
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveUser(user._id)} // Handle remove user
                    >
                      Remove
                    </button>
                    <button
                      className="block-btn"
                      onClick={() => handleUnblockUser(user._id)} // Handle unblock user
                    >
                      Unblock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No blocked users found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockedUsersPage;