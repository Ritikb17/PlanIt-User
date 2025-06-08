import React, { useState, useEffect } from 'react';
import './DiscoverEvents.css'; // Create this CSS file for styling

const DiscoverEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events from API
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
        setEvents(data.data);
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
        // Update the event's alreadySend status
        setEvents(prevEvents => 
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
        // Update the event's alreadySend status
        setEvents(prevEvents => 
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

  return (
    <div className="discover-events-container">
      <h1>Discover Events</h1>
      
      {events.length === 0 ? (
        <div className="no-events">No events available to discover</div>
      ) : (
        <div className="events-list">
          {events.map(event => (
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