import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // To get the username from the URL
import axios from 'axios';
import './Profile.css'; // Reuse the same CSS file

const OtherUserProfile = () => {
  const { username } = useParams(); // Get the username from the URL
  const [user, setUser] = useState(null); // Initialize as null
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasSentRequest, setHasSentRequest] = useState(false); // State to track if a request has been sent
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false); // State to track if users are already connected

  // Fetch the user's data based on the username
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found, please log in again.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/profile/get-profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        if (data.username === username) {
          console.log("redirect to profile");
          window.location.href = '/profile'; // or window.location.assign('/profile');
        }

        // Fetch user data
        const userResponse = await axios.get(
          `http://localhost:5000/api/user/get-user/${username}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Extract the user data from the response
        const userData = userResponse.data.userInfo;
        setUser(userData); // Set the user data
        console.log("User Data:", userData);

        // Check if users are already connected
        setIsAlreadyConnected(userResponse.data.isAlreadyConnected);

        // Check if a follow request has already been sent
        const requestResponse = await axios.get(
          `http://localhost:5000/api/user/already-send-request/${username}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Update the state based on the API response
        setHasSentRequest(requestResponse.data.result);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch user data.');
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [username]); // Re-fetch when the username changes

  const sendFollowRequest = async () => {
    const token = localStorage.getItem('token');
    console.log("Token is:", token);
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }

    try {
      const response = await axios.put(
        'http://localhost:5000/api/user/send-request',
        { _id: user._id }, // Request body
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) { // Check if the request was successful
        alert('Request sent successfully');
        setHasSentRequest(true); // Update the state to reflect that a request has been sent
      } else {
        alert('Failed to send request');
      }
    } catch (error) {
      console.error('Error sending follow request:', error);
      alert('An error occurred while sending the request');
    }
  };

  const unsendFollowRequest = async () => {
    const token = localStorage.getItem('token');
    console.log("Token is:", token);
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }

    try {
      const response = await axios.put(
        'http://localhost:5000/api/user/unsend-request',
        { _id: user._id }, // Request body
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) { // Check if the request was successful
        alert('Request unsent successfully');
        setHasSentRequest(false); // Update the state to reflect that the request has been unsent
      } else {
        alert('Failed to unsend request');
      }
    } catch (error) {
      console.error('Error unsending follow request:', error);
      alert('An error occurred while unsending the request');
    }
  };

  const handleChatButtonClick = () => {
    // Redirect to the chat page or open a chat window
    alert('Redirecting to chat...');
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!user) {
    return <p>User not found.</p>;
  }

  return (
    <div>
      <div className="profile-page">
        {/* User Information */}
        <div className="user-info">
          <>
            <div className="profile-picture-container">
              <img
                src={user.profilePicture || 'https://via.placeholder.com/150'}
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
          </>
        </div>

        {/* Conditional Rendering of Buttons */}
        {isAlreadyConnected ? (
          <button className="chat-btn" onClick={handleChatButtonClick}>
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