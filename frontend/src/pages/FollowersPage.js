import React, { useState } from 'react';
import './FollowersPage.css'; // Import the CSS file
import Navbar from '../components/Navbar';

const FollowersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy data for followers
  const followers = [
    { id: 1, name: 'John Doe', isFollowing: false },
    { id: 2, name: 'Jane Doe', isFollowing: true },
    { id: 3, name: 'Alice Smith', isFollowing: false },
    { id: 4, name: 'Bob Johnson', isFollowing: true },
  ];

  // Filter followers based on search query
  const filteredFollowers = followers.filter((follower) =>
    follower.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Navbar/>
  
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
        {filteredFollowers.length > 0 ? (
          <div className="followers-list">
            {filteredFollowers.map((follower) => (
              <div key={follower.id} className="follower-item">
                <div className="follower-info">
                  <p>{follower.name}</p>
                  <span
                    className={`follow-status ${
                      follower.isFollowing ? 'following' : 'not-following'
                    }`}
                  >
                    {follower.isFollowing ? 'Following' : 'Not Following'}
                  </span>
                </div>
                <div className="follower-actions">
                  {follower.isFollowing ? (
                    <button className="unfollow-btn">Unfollow</button>
                  ) : (
                    <button className="follow-btn">Follow Back</button>
                  )}
                  <button className="remove-btn">Remove</button>
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