import React, { useEffect, useState } from 'react';
import './Profile.css'; // Import the CSS file
import Navbar from '../components/Navbar';
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState({});
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]); // State for storing suggestions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', bio: '', email: '', _id: '', profilePicture: '' });
  const [userNameMessage, setUsernameMessage] = useState('');
  const [isDisable, setIsDisable] = useState(false);
  const [page, setPage] = useState(1); // Pagination: Current page
  const [limit, setLimit] = useState(2); // Pagination: Results per page

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token"); // Retrieve token from localStorage
      if (!token) {
        console.error("No token found, please log in again.");
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
        console.log("DATA is ", data);
        setUser(data);
        setFormData({ username: data.username, bio: data.bio, email: data.email, _id: data._id, profilePicture: data.profilePicture }); // Pre-fill form with current data
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found, please log in again.");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/user/get-suggestion?page=${page}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        setSuggestions(response.data.nonFriends); // Update suggestions state
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setError("Failed to fetch suggestions.");
      }
    };

    fetchSuggestions();
  }, [page, limit]); // Re-fetch when page or limit changes

  // Handle sending follow request
  const handleSendRequest = async (userId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found, please log in again.");
      return;
    }

    try {
      const response = await axios.put(
        "http://localhost:5000/api/user/send-request",
        { _id: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update suggestions list by removing the user who received the request
      setSuggestions((prevSuggestions) =>
        prevSuggestions.filter((user) => user._id !== userId)
      );

      console.log("Follow request sent successfully:", response.data);
    } catch (error) {
      console.error("Error sending follow request:", error);
      setError("Failed to send follow request.");
    }
  };

  // Handle opening the modal
  const handleEditProfile = () => {
    setIsModalOpen(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleUsernameChange = async (event) => {
    const username = event.target.value;
    setFormData({ ...formData, username });

    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found, please log in again.");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/profile/check-user-name?username=${username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("called", response.data);

      if (response.data.allowed) {
        setUsernameMessage('Username Available');
        setIsDisable(false);
      } else {
        setUsernameMessage('Username Already Taken');
        setIsDisable(true);
        if (username === user.username) {
          setUsernameMessage('');
          setIsDisable(false);
        }
      }
    } catch (error) {
      console.error("Error verifying username profile:", error);
      if (error.response) {
        setUsernameMessage(error.response.data.message || 'Failed to verify username');
      } else if (error.request) {
        setUsernameMessage('Network error. Please try again.');
      } else {
        setUsernameMessage('An unexpected error occurred.');
      }
      setIsDisable(true);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle profile picture upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found, please log in again.");
      return;
    }

    console.log("USER INFO is ", formData);

    try {
      const response = await axios.put(
        "http://localhost:5000/api/profile/update-profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setUser(response.data.user);
      console.log("Updated User Data: ", response.data.user);

      setIsModalOpen(false);
      setUsernameMessage('');
      setError("");
    } catch (error) {
      console.error("Error updating profile:", error);

      if (error.response) {
        setError(error.response.data.message || "Failed to update profile");
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    }
  };

  return (
    <div>
      <Navbar />

      <div className="profile-page">
        {/* User Information */}
        <div className="user-info">
          {user ? (
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
                <p className="pronouns">{user.pronouns || 'he/him'}</p>
                <p className="bio">{user.bio || 'Add bio'}</p>
              </div>
            </>
          ) : (
            <p>Loading profile...</p>
          )}
        </div>

        {/* Edit Profile Button */}
        <button className="edit-profile-btn" onClick={handleEditProfile}>
          Edit profile
        </button>

        {/* Discover People Section */}
        <div className="discover-people">
          <h2>Discover people</h2>
          <a href="/discover" className="see-all">
            See all
          </a>

          {/* Display Suggestions */}
          {suggestions.map((suggestion) => (
            <div className="account" key={suggestion._id}>
              <div className="account-info">
                <h3>{suggestion.username}</h3>
                <p>{suggestion.bio || 'No bio available'}</p>
              </div>
              <button
                className="follow-btn"
                onClick={() => handleSendRequest(suggestion._id)}
              >
                Follow
              </button>
            </div>
          ))}
        </div>

        {/* Complete Your Profile Section */}
        <div className="complete-profile">
          <h2>Complete Your Profile</h2>
          <p>Add more details to your profile to help others discover you.</p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Profile</h2>
            {/* Error Message */}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {userNameMessage && (
              <p style={{ color: userNameMessage === 'Username Available' ? 'green' : 'red' }}>
                {userNameMessage}
              </p>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleUsernameChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={user.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="profilePicture">Profile Picture</label>
                <input
                  type="file"
                  id="profilePicture"
                  name="profilePicture"
                  onChange={handleFileChange}
                />
              </div>

              <div className="modal-buttons">
                <button type="button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisable}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;