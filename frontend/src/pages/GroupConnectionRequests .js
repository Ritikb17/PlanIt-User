import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GroupConnectionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replace with your actual token
  const token = localStorage.getItem('token');
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/channel/get-request-channels', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setRequests(response.data.receivedChannelRequest);
        console.log("DATA from api is ",response.data.receivedChannelRequest)
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching connection requests:', err);
      }
    };

    fetchRequests();
  }, []);

  const handleAccept = async (channelId) => {
    try {
      await axios.put(
        'http://localhost:5000/api/channel/accept-channel-connection-request-by-other-user',
        { channelId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      // Remove the accepted request from the list
      setRequests(requests.filter(request => request._id !== channelId));
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Failed to accept request');
    }
  };

  const handleReject = async (channelId) => {
    try {
      await axios.put(
        'http://localhost:5000/api/channel/remove-channel-connection-request-by-other-user',
        { channelId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      // Remove the rejected request from the list
      setRequests(requests.filter(request => request._id !== channelId));
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request');
    }
  };

  if (loading) return <div>Loading connection requests...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="connection-requests-container">
      <h2>Group Connection Requests</h2>
      {requests.length === 0 ? (
        <p>No pending connection requests</p>
      ) : (
        <ul className="requests-list">
          {requests.map(request => (
            <li key={request._id} className="request-item">
              <div className="request-info">
                <h3>{request.name || `Group ${request._id}`}</h3>
                <p>{request.description || 'No description available'}</p>
              </div>
              <div className="request-actions">
                <button 
                  onClick={() => handleAccept(request._id)}
                  className="accept-btn"
                >
                  Accept
                </button>
                <button 
                  onClick={() => handleReject(request._id)}
                  className="reject-btn"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroupConnectionRequests;