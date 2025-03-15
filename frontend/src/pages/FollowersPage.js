import React, { useEffect, useState } from 'react';
import './FollowersPage.css'; // Import the CSS file
import Navbar from '../components/Navbar';
import axios from 'axios';

const FollowersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Fetch non-friends (followers) when the component mounts
  useEffect(() => {
    const fetchNonFriends = async () => {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage
      if (!token) {
        console.error('No token found, please log in again.');
        setError('No token found, please log in again.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          'http://localhost:5000/api/user/get-connections?page=1&limit=8',
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, // Use the token from localStorage
            },
          }
        );

        // Assuming the API returns an array of non-friends in the `nonFriends` field
        setFollowers(response.data.friends); // Update the state with the fetched data
        setIsLoading(false); // Set loading to false
      } catch (error) {
        console.error('Error fetching non-friends:', error);
        setError(error.message); // Set error state
        setIsLoading(false); // Set loading to false
      }
    };

    fetchNonFriends();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle blocking a user
  const handleBlockUser = async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, please log in again.');
      setError('No token found, please log in again.');
      return;
    }

    try {
      await axios.put(
        'http://localhost:5000/api/user/block-user',
        { _id: userId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the followers list by removing the blocked user
      setFollowers((prevFollowers) =>
        prevFollowers.filter((follower) => follower._id !== userId)
      );

      alert('User blocked successfully.');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user.');
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

      // Update the followers list by removing the user
      setFollowers((prevFollowers) =>
        prevFollowers.filter((follower) => follower._id !== userId)
      );

      alert('User removed successfully.');
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user.');
    }
  };

  // Filter followers based on search query
  const filteredFollowers = followers.filter((follower) =>
    follower.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Navbar />

      <div className="followers-page">
        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search followers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Followers Section */}
        <div className="followers-section">
          <h2>Followers</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : filteredFollowers.length > 0 ? (
            <div className="followers-list">
              {filteredFollowers.map((follower) => (
                <div key={follower._id} className="follower-item">
                  <div className="follower-info">
                    <p>{follower.name}</p>
                    <span
                      className={`follow-status ${follower.isFollowing ? 'following' : 'not-following'
                        }`}
                    >
                      {follower.isFollowing ? 'Following' : 'Not Following'}
                    </span>
                  </div>
                  <div className="follower-actions">
                    <button className="unfollow-btn">Unfollow</button>
                    <button className="follow-btn">Open Chat</button>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveUser(follower._id)} // Handle remove user
                    >
                      Remove
                    </button>
                    <button
                      className="block-btn"
                      onClick={() => handleBlockUser(follower._id)} // Handle block user
                    >
                      Block
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No followers found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersPage;