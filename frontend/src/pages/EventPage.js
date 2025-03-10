import React, { useState, useEffect } from 'react';
import './EventPage.css'
import Navbar from '../components/Navbar';

const EventsPage = () => {
  const [events, setEvents] = useState([]);

  // Fetch events from an API or local storage
  useEffect(() => {
    // Example: Fetch events from localStorage (replace with API call if needed)
    const savedEvents = JSON.parse(localStorage.getItem('events')) || [];
    setEvents(savedEvents);
  }, []);

  return (
    <div>
      <Navbar />

      <div className="events-page">
        <h1>My Events</h1>
        {events.length === 0 ? (
          <p>No events found. Create one to get started!</p>
        ) : (
          <div className="events-list">
            {events.map((event, index) => (
              <div key={index} className="event-card">
                <h2>{event.eventName}</h2>
                <p><strong>Date and Time:</strong> {event.eventDateTime}</p>
                <p><strong>Location:</strong> {event.eventLocation}</p>
                <p><strong>Visibility:</strong> {event.isPublic ? 'Public' : 'Private'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;