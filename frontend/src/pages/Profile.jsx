import React, { useEffect, useState } from 'react';
import './Profile.css'; // Import the CSS file
import Navbar from '../components/Navbar';
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState({});
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [formData, setFormData] = useState({ username: '', bio: '', email: '', _id: '' }); 
  const [userNameMessage, setUsernameMessage] = useState('');
  const [isDisable, setIsDisable] = useState(true);

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
        console.log("DATA is ", data)
        setUser(data);
        setFormData({ username: data.username, bio: data.bio, email: data.email, _id: data._id }); // Pre-fill form with current data
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

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
      // Use query parameters for GET requests
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
        if(username===user.username)
          {
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
              <h1>{user.username}</h1>
              <b>
                <p className="pronouns">{user.name || 'he/him'}</p></b>
              <p className="pronouns">{user.pronouns || 'he/him'}</p>
              <p className="bio">{user.bio || 'Add bio'}</p>
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

          <div className="account">
            <div className="account-info">
              <h3>Instagram</h3>
              <p>Instagram Official Account</p>
            </div>
            <button className="follow-btn">Follow</button>
          </div>

          <div className="account">
            <div className="account-info">
              <h3>Anne Hathaway</h3>
              <p>Instagram recommended</p>
            </div>
            <button className="follow-btn">Follow</button>
          </div>
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

        <div className="modal-buttons">
          <button type="button" onClick={handleCloseModal}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isDisable}
            style={{ backgroundColor: isDisable ? 'white' : '#6a1b9a' }}
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