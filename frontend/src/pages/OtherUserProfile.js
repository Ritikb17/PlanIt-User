import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const OtherUserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [coverPicUrl, setCoverPicUrl] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found, please log in again.');
        setIsLoading(false);
        return;
      }

      try {
        // ✅ Prevent viewing own profile
        const meRes = await axios.get('http://localhost:5000/api/profile/get-profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (meRes.data.username === username) {
          navigate('/profile'); // ✅ Use navigate instead of window.location
          return;
        }

        // ✅ Fetch user details
        const userRes = await axios.get(
          `http://localhost:5000/api/user/get-user/${username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const userData = userRes.data;
        setUser(userData.userInfo || userData);
        setIsAlreadyConnected(userData.isAlreadyConnected || false);

        // ✅ Fetch profile picture (binary)
        const profilePicRes = await axios.get(
          `http://localhost:5000/api/picture/other-user-profile-picture/${username}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
          }
        );
        if (profilePicRes.data.size > 0) {
          const profileUrl = URL.createObjectURL(profilePicRes.data);
          setProfilePicUrl(profileUrl);
        }

        // ✅ Fetch cover picture (binary)
        const coverPicRes = await axios.get(
          `http://localhost:5000/api/picture/other-user-cover-picture/${username}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
          }
        );
        if (coverPicRes.data.size > 0) {
          const coverUrl = URL.createObjectURL(coverPicRes.data);
          setCoverPicUrl(coverUrl);
        }

        // ✅ Check if follow request already sent
        const reqRes = await axios.get(
          `http://localhost:5000/api/user/already-send-request/${username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setHasSentRequest(reqRes.data.result || false);
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 404) {
          setError('User not found.');
        } else {
          setError('Failed to fetch user data.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [username, navigate]);

  // 🧹 Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (profilePicUrl) URL.revokeObjectURL(profilePicUrl);
      if (coverPicUrl) URL.revokeObjectURL(coverPicUrl);
    };
  }, [profilePicUrl, coverPicUrl]);

  const sendFollowRequest = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user?._id) return;

    try {
      const response = await axios.put(
        'http://localhost:5000/api/user/send-request',
        { _id: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        alert('Request sent successfully');
        setHasSentRequest(true);
      } else {
        alert('Failed to send request');
      }
    } catch (error) {
      console.error('Error sending follow request:', error);
      alert('Error sending request');
    }
  };

  const unsendFollowRequest = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user?._id) return;

    try {
      const response = await axios.put(
        'http://localhost:5000/api/user/unsend-request',
        { _id: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        alert('Request unsent successfully');
        setHasSentRequest(false);
      } else {
        alert('Failed to unsend request');
      }
    } catch (error) {
      console.error('Error unsending follow request:', error);
      alert('Error unsending request');
    }
  };

  const handleChat = () => {
    // Navigate to chat or open chat modal
    navigate(`/chat/${username}`);
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!user) return <div className="error-message">User not found.</div>;

  return (
    <div className="profile-page">
      {/* ✅ Cover Picture */}
      <div className="cover-picture-container">
        <img
          src={coverPicUrl || 'https://via.placeholder.com/800x250?text=No+Cover+Picture'}
          alt="Cover"
          className="cover-picture"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800x250?text=No+Cover+Picture';
          }}
        />
      </div>

      {/* ✅ Profile Section */}
      <div className="user-info">
        <div className="profile-picture-container">
          <img
            src={profilePicUrl || 'https://via.placeholder.com/150'}
            alt="Profile"
            className="profile-picture"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/150';
            }}
          />
        </div>
        <div className="user-details">
          <h1>{user.username}</h1>
          <p className="name">{user.name || 'No name provided'}</p>
          <p className="pronouns">{user.pronouns || 'No pronouns provided'}</p>
          <p className="bio">{user.bio || 'No bio available'}</p>
        </div>
      </div>

      {/* ✅ Follow / Chat Button */}
      <div className="action-buttons">
        {isAlreadyConnected ? (
          <button className="chat-btn" onClick={handleChat}>
            Chat
          </button>
        ) : (
          <button
            className={`follow-btn ${hasSentRequest ? 'unsend-btn' : ''}`}
            onClick={hasSentRequest ? unsendFollowRequest : sendFollowRequest}
          >
            {hasSentRequest ? 'Unsend Request' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
};

export default OtherUserProfile;