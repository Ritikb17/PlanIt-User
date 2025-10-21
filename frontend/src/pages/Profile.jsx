import React, { useEffect, useState } from 'react';
import './Profile.css';
import Navbar from '../components/Navbar';
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState({});
  const [coverPicture, setCoverPicture] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    email: '',
    _id: ''
  });
  const [userNameMessage, setUsernameMessage] = useState('');
  const [isDisable, setIsDisable] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(2);

  // ✅ Fetch main profile + actual images (as binary)
  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return console.error("No token found");

      try {
        // Fetch main profile info
        const profileRes = await fetch('http://localhost:5000/api/profile/get-profile', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!profileRes.ok) throw new Error('Failed to fetch user profile');
        const data = await profileRes.json();

        // Fetch actual profile picture as blob
        const profilePicRes = await fetch('http://localhost:5000/api/picture/my-profile-picture', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let profilePicUrl = '';
        if (profilePicRes.ok) {
          const blob = await profilePicRes.blob();
          profilePicUrl = URL.createObjectURL(blob);
          setProfilePicture(profilePicUrl);
        }

        // Fetch actual cover picture as blob
        const coverPicRes = await fetch('http://localhost:5000/api/picture/my-cover-picture', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let coverPicUrl = '';
        if (coverPicRes.ok) {
          const blob = await coverPicRes.blob();
          coverPicUrl = URL.createObjectURL(blob);
          setCoverPicture(coverPicUrl);
        }

        setUser({ ...data });
        setFormData({
          username: data.username,
          bio: data.bio,
          email: data.email,
          _id: data._id,
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfileData();
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(
          `http://localhost:5000/api/user/get-suggestion?page=${page}&limit=${limit}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuggestions(response.data.nonFriends);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setError("Failed to fetch suggestions.");
      }
    };

    fetchSuggestions();
  }, [page, limit]);

  // Handle follow request
  const handleSendRequest = async (userId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(
        "http://localhost:5000/api/user/send-request",
        { _id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("Error sending follow request:", err);
    }
  };

  const handleEditProfile = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // Username check
  const handleUsernameChange = async (event) => {
    const username = event.target.value;
    setFormData({ ...formData, username });
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/api/profile/check-user-name?username=${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
      console.error("Error verifying username:", error);
      setUsernameMessage('Failed to verify username');
      setIsDisable(true);
    }
  };

  // Handle other input fields
 const handleInputChange = (e) => {
  const { name, type, checked, value } = e.target;

  setFormData({
    ...formData,
    [name]: type === "checkbox" ? checked : value,
  });
};

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/picture/upload/profilePicture',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Refresh profile picture
      const profilePicRes = await fetch('http://localhost:5000/api/picture/my-profile-picture', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profilePicRes.ok) {
        const blob = await profilePicRes.blob();
        const profilePicUrl = URL.createObjectURL(blob);
        setProfilePicture(profilePicUrl);
      }

      console.log('Profile picture updated successfully');
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to upload profile picture');
    }
  };

  // Handle cover picture upload
  const handleCoverPictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const formData = new FormData();
    formData.append('profilePicture', file); // Note: The API expects 'profilePicture' field name based on your curl example

    try {
      const response = await axios.post(
        'http://localhost:5000/api/picture/upload/coverPicture',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Refresh cover picture
      const coverPicRes = await fetch('http://localhost:5000/api/picture/my-cover-picture', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (coverPicRes.ok) {
        const blob = await coverPicRes.blob();
        const coverPicUrl = URL.createObjectURL(blob);
        setCoverPicture(coverPicUrl);
      }

      console.log('Cover picture updated successfully');
    } catch (err) {
      console.error('Error uploading cover picture:', err);
      setError('Failed to upload cover picture');
    }
  };

  // Update profile (only username and bio)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.put(
        "http://localhost:5000/api/profile/update-profile",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(response.data.user);
      setIsModalOpen(false);
      setUsernameMessage('');
      setError('');
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    }
  };

  return (
    <div>
      <Navbar />

      <div className="profile-page">
        {/* ✅ Cover Picture Section with Edit Button */}
        <div className="cover-picture-container">
          <img
            src={coverPicture || 'https://via.placeholder.com/800x200?text=Add+Cover+Photo'}
            alt="Cover"
            className="cover-picture"
          />
          <div className="cover-picture-edit">
            <input
              type="file"
              id="coverPictureInput"
              accept="image/*"
              onChange={handleCoverPictureUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="coverPictureInput" className="edit-picture-btn">
              Edit Cover
            </label>
          </div>
        </div>

        {/* User Information */}
        <div className="user-info">
          <div className="profile-picture-container">
            <img
              src={profilePicture || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="profile-picture"
            />
            <div className="profile-picture-edit">
              <input
                type="file"
                id="profilePictureInput"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="profilePictureInput" className="edit-picture-btn">
                Edit Profile
              </label>
            </div>
          </div>
          <div className="user-details">
            <h1>{user.username}</h1>
            <p className="bio">{user.bio || 'Add bio'}</p>
          </div>
        </div>

        <button className="edit-profile-btn" onClick={handleEditProfile}>
          Edit Profile Info
        </button>

        {/* Discover People */}
        <div className="discover-people">
          <h2>Discover people</h2>
          {suggestions.map((s) => (
            <div className="account" key={s._id}>
              <div className="account-info">
                <h3>{s.username}</h3>
                <p>{s.bio || 'No bio available'}</p>
              </div>
              <button className="follow-btn" onClick={() => handleSendRequest(s._id)}>
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Edit Profile Modal (Only for username and bio) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Profile Info</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {userNameMessage && (
              <p style={{ color: userNameMessage === 'Username Available' ? 'green' : 'red' }}>
                {userNameMessage}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleUsernameChange} 
                />
              </div>

              <div className="form-group">
                <label>Name </label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                />
                <label>Bio</label>
                <textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleInputChange} 
                />
                <br />
                <br />
                <label>Private account</label>
                <input
                  type="checkbox"
                  name="isAccountPrivate"
                  checked={formData.isAccountPrivate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-buttons">
                <button type="button" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" disabled={isDisable}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;