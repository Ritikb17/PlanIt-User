import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './GroupRequestsPage.css';
import Navbar from '../components/Navbar';

const GroupRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchGroupRequests();
  }, []);

  const fetchGroupRequests = async () => {
    try {
      console.log("Fetching group requests...");
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/channel/get-request-channels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Transform the API response to match our expected format
      const transformedRequests = response.data.receivedChannelRequest.map(channel => ({
        channel: {
          _id: channel._id,
          name: channel.name,
          description: channel.bio,
          isPrivate: channel.isPrivate,
          createdBy: channel.createdBy
        },
        // The user is the current user since they're the ones receiving the requests
        user: {
          _id: response.data._id,
          email: response.data.email
        }
      }));
      
      setRequests(transformedRequests);
    } catch (err) {
      console.error("Error fetching group requests:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (groupId, userId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/channel/accept-channel-connection-request-by-other-user`,
        { 
            "channelId":groupId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      fetchGroupRequests();
      alert('Request approved successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (groupId, userId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/channel/reject-request/${groupId}/${userId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      fetchGroupRequests();
      alert('Request rejected successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading group requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div>Error: {error}</div>
        <button onClick={fetchGroupRequests}>Retry</button>
      </div>
    );
  }

  return (
    <div className="group-requests-container">
      <Navbar />
      
      <div className="group-requests-layout">
        {/* Side Navigation */}
        <div className="side-navigation">
          <div className="nav-section">
            <h3>Group Actions</h3>
            <ul>
              <li>
                <a href="/create-group">Create New Group</a>
              </li>
              <li>
                <a href="/group-requests" className="active">Group Requests</a>
              </li>
              <li>
                <a href="/discover-groups">Discover Groups</a>
              </li>
              <li>
                <a href="/my-pending-requests">My Pending Requests</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <h1>Group Join Requests</h1>
          
          {requests.length > 0 ? (
            <div className="requests-list">
              {requests.map((request) => (
                <div key={`${request.channel._id}-${request.user._id}`} className="request-item">
                  <div className="request-info">
                    <div className="user-info">
                      <h3>{request.user.name || request.user.email}</h3>
                      <p>wants to join</p>
                    </div>
                    <div className="group-info">
                      <h3>{request.channel.name}</h3>
                      {request.channel.isPrivate && <span className="private-badge">Private</span>}
                      <p className="group-description">{request.channel.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="approve-btn"
                      onClick={() => handleApproveRequest(request.channel._id, request.user._id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleRejectRequest(request.channel._id, request.user._id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-requests-message">
              <p>No pending group requests</p>
              <button 
                className="discover-btn"
                onClick={() => navigate('/discover-groups')}
              >
                Discover Groups
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupRequestsPage;