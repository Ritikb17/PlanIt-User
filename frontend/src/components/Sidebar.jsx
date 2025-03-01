import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="profile-info">
        <h3>John Doe</h3>
        <p>Followers: 100</p>
        <p>Following: 50</p>
      </div>
      <div className="suggestions">
        <h4>Suggestions</h4>
        <ul>
          <li>User1</li>
          <li>User2</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;