import React, { useEffect, useState } from 'react';
import './Profile.css'; // Import the CSS file
import Navbar from '../components/Navbar';
import axios from "axios";


const Profile = () => {
  const [user, setUser] = useState({});
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [formData, setFormData] = useState({ username: '', bio: '',email:'', _id:''}); // State for form inputs

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
        console.log("DATA is ",data)
        setUser(data);
        setFormData({ username: data.username, bio: data.bio ,email: data.email,_id:data._id}); // Pre-fill form with current data
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

  // Handle form input changes
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission

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
  
      setUser(response.data.user); // ✅ Update user state with new data
      console.log("Updated User Data: ", response.data.user);
  
      setIsModalOpen(false); // ✅ Close the modal after a successful update
      setError(""); // ✅ Clear error messages on success
    } catch (error) {
      console.error("Error updating profile:", error);
  
      // ✅ Check if error response exists and set the message
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
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="username">Name</label>
                <input
                  type="text"
                  id="username"
                  name="username"
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
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;