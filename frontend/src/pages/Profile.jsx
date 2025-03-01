import React from 'react';
import './Profile.css'; // Import the CSS file

const Profile = () => {
  return (
    <div className="profile-page">
      {/* User Information */}
      <div className="user-info">
        <h1>Bill Smith</h1>
        <p className="pronouns">he/him</p>
        <p className="bio">I’m a freelance photographer!</p>
      </div>

      {/* Edit Profile Button */}
      <button className="edit-profile-btn">Edit profile</button>

      {/* Discover People Section */}
      <div className="discover-people">
        <h2>Discover people</h2>
        <a href="/discover" className="see-all">
          See all
        </a>

        {/* Instagram Official Account */}
        <div className="account">
          <div className="account-info">
            <h3>Instagram</h3>
            <p>Instagram Official Account</p>
          </div>
          <button className="follow-btn">Follow</button>
        </div>

        {/* Instagram Recommended Account */}
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
  );
};

export default Profile;