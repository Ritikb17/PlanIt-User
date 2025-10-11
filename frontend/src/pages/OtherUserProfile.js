import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const OtherUserProfile = () => {
  const { username } = useParams();
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
        const meRes = await fetch('http://localhost:5000/api/profile/get-profile', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!meRes.ok) throw new Error('Failed to fetch profile');
        const meData = await meRes.json();
        if (meData.username === username) {
          window.location.href = '/profile';
          return;
        }

        // ✅ Fetch user details
        const userRes = await axios.get(
          `http://localhost:5000/api/user/get-user/${username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const userData = userRes.data;
        setUser(userData.userInfo || userData); // ✅ handles both cases
        setIsAlreadyConnected(userData.isAlreadyConnected);

        // ✅ Fetch profile picture (binary)
        const profilePicRes = await axios.get(
          `http://localhost:5000/api/picture/other-user-profile-picture/${username}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
          }
        );
        setProfilePicUrl(URL.createObjectURL(profilePicRes.data));

        // ✅ Fetch cover picture (binary)
        const coverPicRes = await axios.get(
          `http://localhost:5000/api/picture/other-user-cover-picture/${username}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
          }
        );
        setCoverPicUrl(URL.createObjectURL(coverPicRes.data));

        // ✅ Check if follow request already sent
        const reqRes = await axios.get(
          `http://localhost:5000/api/user/already-send-request/${username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setHasSentRequest(reqRes.data.result);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch user data.');
        setIsLoading(false);
      }
    };

    fetchUserData();

    // 🧹 Clean up object URLs
    return () => {
      if (profilePicUrl) URL.revokeObjectURL(profilePicUrl);
      if (coverPicUrl) URL.revokeObjectURL(coverPicUrl);
    };
  }, [username]);

  const sendFollowRequest = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.put(
        'http://localhost:5000/api/user/send-request',
        { _id: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        alert('Request sent successfully');
        setHasSentRequest(true);
      } else alert('Failed to send request');
    } catch (error) {
      console.error('Error sending follow request:', error);
      alert('Error sending request');
    }
  };

  const unsendFollowRequest = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.put(
        'http://localhost:5000/api/user/unsend-request',
        { _id: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        alert('Request unsent successfully');
        setHasSentRequest(false);
      } else alert('Failed to unsend request');
    } catch (error) {
      console.error('Error unsending follow request:', error);
      alert('Error unsending request');
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!user) return <p>User not found.</p>;

  return (
    <div className="profile-page">
      {/* ✅ Cover Picture */}
      <div className="cover-picture-container">
        <img
          src={coverPicUrl || 'https://via.placeholder.com/800x250?text=No+Cover+Picture'}
          alt="Cover"
          className="cover-picture"
        />
      </div>

      {/* ✅ Profile Section */}
      <div className="user-info">
        <div className="profile-picture-container">
          <img
            src={profilePicUrl || 'https://via.placeholder.com/150'}
            alt="Profile"
            className="profile-picture"
          />
        </div>
        <div className="user-details">
          <h1>{user.username}</h1>
          <p className="pronouns">{user.name || 'No name provided'}</p>
          <p className="pronouns">{user.pronouns || 'No pronouns provided'}</p>
          <p className="bio">{user.bio || 'No bio available'}</p>
        </div>
      </div>

      {/* ✅ Follow / Chat Button */}
      {isAlreadyConnected ? (
        <button className="chat-btn" onClick={() => alert('Redirecting to chat...')}>
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
  );
};

export default OtherUserProfile;
