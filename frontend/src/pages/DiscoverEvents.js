import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DiscoverEvents.css';

const DiscoverEvents = () => {
  const [events, setEvents] = useState([]);           // All events
  const [searchQuery, setSearchQuery] = useState(''); // User search text
  const [filteredEvents, setFilteredEvents] = useState([]); // Search results
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all events initially
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/events/discover-events', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.data) {
        setEvents(data.data);          // All events
        setFilteredEvents(data.data);  // Initially show all
      } else {
        setError(data.message || 'No events found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle search input
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // If search query is empty, reset to show all events
    if (query.trim() === '') {
      setFilteredEvents(events);  // Show all events when search is cleared
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:5000/api/events/search-events/${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Debug log: Check the response structure
      console.log('Search API Response:', response.data);

      if (response.data.data && response.data.data.length > 0) {
        setFilteredEvents(response.data.data); // Set filtered events
      } else {
        setFilteredEvents([]); // No results found
      }
    } catch (error) {
      console.error('Error searching events:', error);
      setFilteredEvents([]); // Ensure no results are shown if error occurs
    }
  };

  // Handle send request
  const handleSendRequest = async (eventId) => {
    try {
      const response = await fetch('http://localhost:5000/api/events/send-event-connection-request-by-other-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ eventId })
      });

      const data = await response.json();
      if (response.ok) {
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event._id === eventId ? { ...event, alreadySend: true } : event
          )
        );
        setFilteredEvents(prevEvents =>
          prevEvents.map(event =>
            event._id === eventId ? { ...event, alreadySend: true } : event
          )
        );
      } else {
        throw new Error(data.message || 'Failed to send request');
      }
    } catch (err) {
      console.error('Error sending request:', err);
      alert(err.message);
    }
  };

  // Handle unsend request
  const handleUnsendRequest = async (eventId) => {
    try {
      const response = await fetch('http://localhost:5000/api/events/unsend-event-connection-request-by-other-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ eventId })
      });

      const data = await response.json();
      if (response.ok) {
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event._id === eventId ? { ...event, alreadySend: false } : event
          )
        );
        setFilteredEvents(prevEvents =>
          prevEvents.map(event =>
            event._id === eventId ? { ...event, alreadySend: false } : event
          )
        );
      } else {
        throw new Error(data.message || 'Failed to unsend request');
      }
    } catch (err) {
      console.error('Error unsending request:', err);
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  // Render events (either search results or all events)
  const eventsToRender = searchQuery.trim() ? filteredEvents : events;

  return (
    <div className="discover-events-container">
      <h1>Discover Events</h1>

      {/* 🔍 Search box */}
      <input
        type="text"
        placeholder="Search events..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-input"
      />

      {eventsToRender.length === 0 ? (
        <div className="no-events">No events found</div>
      ) : (
        <div className="events-list">
          {eventsToRender.map(event => (
            <div key={event._id} className="event-card">
              <h3>{event.name}</h3>
              <p>{event.description}</p>
              <div className="event-actions">
                {event.alreadySend ? (
                  <button 
                    className="unsend-btn"
                    onClick={() => handleUnsendRequest(event._id)}
                  >
                    Unsend Request
                  </button>
                ) : (
                  <button 
                    className="send-btn"
                    onClick={() => handleSendRequest(event._id)}
                  >
                    Send Request
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoverEvents;
