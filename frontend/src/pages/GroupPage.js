import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GroupPage.css';
import Navbar from '../components/Navbar';

const GroupPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [myGroups, setMyGroups] = useState([]);
  const [otherGroups, setOtherGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState('67ec24493c0ea5d4d135ef8d'); // Your user ID from the token
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZWMyNDQ5M2MwZWE1ZDRkMTM1ZWY4ZCIsImlhdCI6MTc0MzYyMjk3MiwiZXhwIjoxNzQzNjI2NTcyfQ.u2MLkd3kiHKKM6SQ3MBdOEGCXQtRFYzrTw6rpE-7454';

  useEffect(() => {
    fetchGroups();
  }, [userId]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/channel/get-channels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const allGroups = response.data.connectedgroups.connectedChannels || [];
      
      const myGroupsList = allGroups.filter(group => 
        group.members.includes(userId)
      );
      
      const otherGroupsList = allGroups.filter(group => 
        !group.members.includes(userId)
      );
      
      setMyGroups(myGroupsList);
      setOtherGroups(otherGroupsList);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Error fetching groups:', err);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await axios.delete(`http://localhost:5000/api/channel/leave-channel/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Refresh the groups list after deletion
      fetchGroups();
      alert('Group deleted successfully');
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('Failed to delete group');
    }
  };

  // Filter groups based on search query
  const filteredMyGroups = myGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOtherGroups = otherGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div>Loading groups...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const renderGroupList = (groups, isMyGroup = false) => (
    <div className="groups-list">
      {groups.map((group) => (
        <div key={group._id} className="group-item">
          <div className="group-info">
            <p>{group.name}</p>
            <span className="members">{group.members?.length || 0} members</span>
            {group.isPrivate && <span className="private-badge">Private</span>}
          </div>
          <div className="group-actions">
            {isMyGroup ? (
              <button 
                className="delete-btn"
                onClick={() => handleLeaveGroup(group._id)}
              >
                Leave
              </button>
            ) : (
              <button className="join-btn">Join</button>
            )}
          </div>
        </div>
      ))}
    </div>
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
          {/* My Groups Section */}
          <div className="group-category">
            <h2>My Groups</h2>
            {filteredMyGroups.length > 0 ? (
              renderGroupList(filteredMyGroups, true)
            ) : (
              <p>You haven't joined any groups yet.</p>
            )}
          </div>

          {/* Other Groups Section */}
          <div className="group-category">
            <h2>Other Groups</h2>
            {filteredOtherGroups.length > 0 ? (
              renderGroupList(filteredOtherGroups)
            ) : (
              <p>No other groups available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;