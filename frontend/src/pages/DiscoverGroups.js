import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DiscoverGroups.css'; // Create this CSS file
import Navbar from '../components/Navbar';

const DiscoverGroups = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDiscoverGroups();
  }, []);

  const fetchDiscoverGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/channel/discover-channels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setChannels(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (channelId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/channel/join-channel/${channelId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      // Refresh the list after joining
      fetchDiscoverGroups();
      alert('Join request sent successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send join request');
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading channels...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div>Error: {error}</div>
        <button onClick={fetchDiscoverGroups}>Retry</button>
      </div>
    );
  }

  return (
    <div className="discover-channels-container">
      <Navbar />
      
      <div className="discover-content">
        <h1>Discover Channels</h1>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="channels-list">
          {filteredChannels.length > 0 ? (
            filteredChannels.map((channel) => (
              <div key={channel._id} className="channel-card">
                <div className="channel-info">
                  <h3>{channel.name}</h3>
                  <div className="channel-meta">
                    {channel.isPrivate && <span className="private-badge">Private</span>}
                    <span className="members-count">{channel.members.length} members</span>
                  </div>
                  <p className="channel-description">
                    {channel.message.length > 0 
                      ? `${channel.message.length} messages` 
                      : 'No messages yet'}
                  </p>
                </div>
                <div className="channel-actions">
                  <button
                    className={`join-btn ${channel.isPrivate ? 'private' : 'public'}`}
                    onClick={() => handleJoinRequest(channel._id)}
                  >
                    {channel.isPrivate ? 'Request to Join' : 'Join Channel'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-channels-message">
              No channels available to discover.
              <br />
              <button 
                className="create-channel-btn"
                onClick={() => navigate('/create-channel')}
              >
                Create New Channel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverGroups;