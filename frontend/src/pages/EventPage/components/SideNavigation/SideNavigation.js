import React from 'react';
import './SideNavigation.css';

const SideNavigation = ({ onCreateEvent }) => {
  return (
    <div className="side-navigation">
      <div className="nav-section">
        <h3>Event Actions</h3>
        <ul>
          <li>
            <button
              className="nav-link-button"
              onClick={onCreateEvent}
            >
              Create New Event
            </button>
          </li>
          <li>
            <a href="/event-requests">Event Requests</a>
          </li>
          <li>
            <a href="/discover-events">Discover Events</a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SideNavigation;