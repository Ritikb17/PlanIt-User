import React, { useState } from 'react';
import './GroupPage.css'; // Import the CSS file
import Navbar from '../components/Navbar';

const GroupPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy data for groups
  const groups = [
    { id: 1, name: 'React Developers', members: 120 },
    { id: 2, name: 'Photography Enthusiasts', members: 85 },
    { id: 3, name: 'Fitness Freaks', members: 200 },
    { id: 4, name: 'Book Lovers', members: 150 },
  ];

  // Filter groups based on search query
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Navbar />

      <div className="group-page">
        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Groups Section */}
        <div className="groups-section">
          <h2>Groups</h2>
          {filteredGroups.length > 0 ? (
            <div className="groups-list">
              {filteredGroups.map((group) => (
                <div key={group.id} className="group-item">
                  <div className="group-info">
                    <p>{group.name}</p>
                    <span className="members">{group.members} members</span>
                  </div>
                  <div className="group-actions">
                    <button className="join-btn">Join</button>
                    <button className="leave-btn">Leave</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No groups found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupPage;