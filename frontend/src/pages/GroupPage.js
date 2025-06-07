import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './GroupPage.css';
import Navbar from '../components/Navbar';
import ChannelChatModal from './channelChatModel'

const GroupPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [myChannels, setMyChannels] = useState([]);
  const [otherChannels, setOtherChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [newChannel, setNewChannel] = useState({
    name: '',
    bio: '',
    isPrivate: true
  });
  const [createChannelError, setCreateChannelError] = useState('');
  // At the top with other state declarations
const [isChatModalOpen, setIsChatModalOpen] = useState(false);
const [selectedChatChannel, setSelectedChatChannel] = useState(null);
// Add these state variables near your other state declarations
const [receivedRequests, setReceivedRequests] = useState([]);
const [showReceivedRequestsModal, setShowReceivedRequestsModal] = useState(false);
const [currentChannelForRequests, setCurrentChannelForRequests] = useState(null);
const openChatModal = (channel) => {
  setSelectedChatChannel(channel);
  setIsChatModalOpen(true);
};

const closeChatModal = () => {
  setIsChatModalOpen(false);
  setSelectedChatChannel(null);
};
  const navigate = useNavigate();

  const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMyChannels();
    fetchOtherChannels();
  }, []);

    const fetchMyChannels = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/channel/get-my-channels', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const connectedChannels = response.data.connectedgroups.channels || [];
        const allChannels = response.data.connectedgroups?.channels || [];

        setMyChannels(connectedChannels);

      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
  const fetchOtherChannels = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/channel/get-other-user-channels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });



      const connectedChannels = response.data.connectedgroups.connectedChannels || [];


      setOtherChannels(connectedChannels);
      console.log("OTHER CHANNEL LIST ", connectedChannels)


    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveChannel = async (channelId) => {
    try {
      await axios.delete(`http://localhost:5000/api/channel/leave-channel/${channelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchMyChannels();
      alert('Left channel successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave channel');
    }
  };

  const handleJoinChannel = async (channel) => {
    setSelectedChannel(channel);
    const channel_id = channel._id;
    let endpoint=''

    try {
      if(channel.isPrivate){
       endpoint =`http://localhost:5000/api/user/get-connections-for-channel-request/${channel_id}`
      }
      else{
       endpoint =`http://localhost:5000/api/user/get-suggestion-for-channel-request/${channel_id}`

      }

      const response = await axios.get(`${endpoint}?page=1&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle both response formats

      console.log("response is ", response);
      let users = [];
      if (response.data.nonFriends) {
        users = response.data.nonFriends;
      } else if (response.data.friends) {
        users = response.data.friends;
      } else {
        throw new Error('Unexpected API response format');
      }

      // Initialize users with loading and sent states
      const usersWithState = users.map(user => ({
        ...user,
        isSending: false,
        isSent: false
      }));

      setUsersList(usersWithState);
      setShowUserSelectionModal(true);

    } catch (err) {
      console.error("Error fetching users:", err);
      alert(err.response?.data?.message || err.message || 'Failed to fetch users');
    }
  };

  const handleSendRequest = async (receiverId) => {
    if (!selectedChannel) return;

    try {
      // Update loading state for this user
      setUsersList(prev => prev.map(user =>
        user._id === receiverId ? { ...user, isSending: true } : user
      ));

      await axios.put(
        'http://localhost:5000/api/channel/send-channel-connection-request-by-creator',
        {
          channelId: selectedChannel._id,
          senderId: receiverId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update sent state for this user
      setUsersList(prev => prev.map(user =>
        user._id === receiverId ? { ...user, isSending: false, isSent: true } : user
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send connection request');
      // Reset loading state on error
      setUsersList(prev => prev.map(user =>
        user._id === receiverId ? { ...user, isSending: false } : user
      ));
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannel.name) {
      setCreateChannelError('Channel name is required');
      return;
    }
    console.log("Data is ", newChannel.isPrivate);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/channel/create-channel',
        {
          name: newChannel.name,
          bio: newChannel.bio,
          isPrivate: newChannel.isPrivate
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setShowCreateModal(false);
      setNewChannel({
        name: '',
        bio: '',
        isPrivate: true
      });
      setCreateChannelError('');
      fetchOtherChannels();
      alert('Channel created successfully!');
    } catch (err) {
      setCreateChannelError(err.response?.data?.message || 'Failed to create channel');
    }
  };
  const handleRequestAction = async (requestId, action) => {
  try {
    // Implement your API call to accept/reject the request
    // This is just a placeholder - adjust based on your API
    const response = await fetch(`http://localhost:5000/api/channel/${action}-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        requestId: requestId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to ${action} request`);
    }
    
    // Update the UI by removing the handled request
    setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
    
    // Optionally show a success message
  } catch (error) {
    console.error(`Error ${action}ing request:`, error);
    // Handle error (show toast, etc.)
  }
};

  const otherChannelList = myChannels

  const myChannelsList = myChannels
  console.log("MY CHANNEL LIST ", myChannelsList)
  const handleShowReceivedRequests = async (channelId) => {
  try {
    const token = localStorage.getItem('token');
    setCurrentChannelForRequests(channelId);
    console.log("the channel id is",channelId)
    const response = await fetch('http://localhost:5000/api/channel/get-request-to-the-channel-send-by-other-user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Replace with your actual token
      },
      body: JSON.stringify({
        channelId: channelId
      })
    });
    console.log("resposne is",response)
    if (!response.ok) {
      throw new Error('Failed to fetch requests');
    }
    
    const data = await response.json();
    setReceivedRequests(data.requests); // Adjust based on your API response structure
    console.log("the dat form the api is ",data.request);
    setShowReceivedRequestsModal(true);
  } catch (error) {
    console.error('Error fetching received requests:', error);
    // Handle error (show toast, etc.)
  }
};


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
        <button onClick={fetchOtherChannels}>Retry</button>
      </div>
    );
  }

  const renderChannelList = (channels, isMyChannel = false) => (
  <div className="channels-list">
    {channels.length > 0 ? (
      channels.map((channel) => (
        <div key={channel._id} className="channel-item">
          <div 
            className="channel-info" 
            onClick={() => openChatModal(channel)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{channel.name}</h3>
            {channel.isPrivate && <span className="private-badge">Private</span>}
            <p className="channel-description">{channel.description || 'No description'}</p>
          </div>
          <div className="channel-actions">
            {isMyChannel ? (
              <button
                className="leave-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeaveChannel(channel._id);
                }}
              >
                Leave
              </button>
            ) : (
              <>
                <button
                  className="join-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinChannel(channel);
                  }}
                >
                  Send Connection Request
                </button>
                <button
                  className="receive-request-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowReceivedRequests(channel._id);
                  }}
                >
                  View Requests
                </button>
              </>
            )}
          </div>
        </div>
      ))
    ) : (
      <div className="no-channels-message">
        {isMyChannel
          ? 'You are not a member of any channels yet.'
          : 'No channels available to join.'}
        <br />
        {isMyChannel && (
          <button
            className="discover-btn"
            onClick={() => navigate('/discover-groups')}
          >
            Discover Groups
          </button>
        )}
      </div>
    )}
  </div>
);


  return (
    <div className="channel-page-container">
      <Navbar />

      <div className="channel-page-layout">
        {/* Side Navigation */}
        <div className="side-navigation">
          <div className="nav-section">
            <h3>Channel Actions</h3>
            <ul>
              <li>
                <button
                  className="nav-link-button"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create New Channel
                </button>
              </li>
              <li>
                <a href="/channel-requests">Channel Requests</a>
              </li>
              <li>
                <a href="/discover-groups">Discover Channels</a>
              </li>
              <li>
                <a href="/my-pending-requests">My Pending Requests</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="channels-section">
            <div className="channel-category">
              <h2>My Channels</h2>
              {renderChannelList(myChannels,false)}
            </div>
            <div className="channel-category">
              <h2>Connected Channels</h2>
              {renderChannelList(otherChannels,true)}
            </div>


          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Channel</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateChannelError('');
                }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {createChannelError && (
                <div className="error-message">{createChannelError}</div>
              )}

              <div className="form-group">
                <label htmlFor="channel-name">Channel Name*</label>
                <input
                  id="channel-name"
                  type="text"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  placeholder="Enter channel name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="channel-bio">Description</label>
                <textarea
                  id="channel-bio"
                  value={newChannel.bio}
                  onChange={(e) => setNewChannel({ ...newChannel, bio: e.target.value })}
                  placeholder="Enter channel description (optional)"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newChannel.isPrivate}
                    onChange={(e) => setNewChannel({ ...newChannel, isPrivate: e.target.checked })}
                  />
                  Private Channel
                </label>
                <small className="hint">
                  {newChannel.isPrivate
                    ? 'Users will need to request to join'
                    : 'Anyone can join without approval'}
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateChannelError('');
                }}
              >
                Cancel
              </button>
              <button
                className="create-button"
                onClick={handleCreateChannel}
              >
                Create Channel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Selection Modal */}
      {showUserSelectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Select Users to Connect</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowUserSelectionModal(false);
                  setSelectedChannel(null);
                }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="users-list">
                {usersList.map(user => (
                  <div key={user._id} className="user-item">
                    <div className="user-info">
                      <h4>{user.name || user.username}</h4>
                      <p>{user.bio || 'No bio available'}</p>
                    </div>
                    <button
                      className={`send-request-btn ${user.isSent ? 'sent' : ''}`}
                      onClick={() => handleSendRequest(user._id)}
                      disabled={user.isSending || user.isSent}
                    >
                      {user.isSending ? 'Sending...' :
                        user.isSent ? 'Request Sent' : 'Send Request'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowUserSelectionModal(false);
                  setSelectedChannel(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Channel Chat Modal */}
{isChatModalOpen && selectedChatChannel && (
  <ChannelChatModal
    channel={selectedChatChannel}
    onClose={closeChatModal}
    // Pass any additional props your ChannelChatModal needs
    // For example:
    currentUserId={userId}
    // token={token}
  />
)}
{showReceivedRequestsModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h2>Received Join Requests</h2>
        <button
          className="close-button"
          onClick={() => {
            setShowReceivedRequestsModal(false);
            setReceivedRequests([]);
          }}
        >
          &times;
        </button>
      </div>

      <div className="modal-body">
        {receivedRequests.length > 0 ? (
          <div className="requests-list">
            {receivedRequests.map(request => (
              <div key={request._id} className="request-item">
                <div className="user-info">
                  <h4>{request.sender.name || request.sender.username}</h4>
                  <p>Status: {request.status}</p>
                </div>
                <div className="request-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleRequestAction(request._id, 'accept')}
                  >
                    Accept
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleRequestAction(request._id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No pending requests for this channel.</p>
        )}
      </div>

      <div className="modal-footer">
        <button
          className="cancel-button"
          onClick={() => {
            setShowReceivedRequestsModal(false);
            setReceivedRequests([]);
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default GroupPage;