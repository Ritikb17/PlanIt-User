import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './GroupPage.css';
import Navbar from '../components/Navbar';
import EventChatModal from './eventChatModel';

const EventPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [myEvents, setMyEvents] = useState([]);
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    isPrivate: true,
    eventDate: ''
  });
  const [createEventError, setCreateEventError] = useState('');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedChatEvent, setSelectedChatEvent] = useState(null);

  const openChatModal = (event) => {
    setSelectedChatEvent(event);
    setIsChatModalOpen(true);
  };

  const closeChatModal = () => {
    setIsChatModalOpen(false);
    setSelectedChatEvent(null);
  };

  const navigate = useNavigate();
  // const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])?.id;
    const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMyEvents();
    fetchEventRequests();
  }, []);

const fetchMyEvents = async () => {
  if (!token) {
    console.error("No token available");
    return;
  }

  try {
    setLoading(true);
    console.log("Making request with token:", token); // Debug token
    
    const response = await axios.get('http://localhost:5000/api/events/get-my-events', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log("Full API response:", response.data.events.connectedEvents); // Debug full response
    
    const events = response.data.events.connectedEvents;  
    console.log("Processed events:", events); // Debug processed data
    
    if (events.length === 0) {
      console.warn("Received empty events array");
    }
    
    setMyEvents(events);
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message;
    console.error("API Error:", err.response?.data || err); // More detailed error
    setError(errorMsg);
  } finally {
    setLoading(false);
  }
};

  const fetchEventRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/events/get-event-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const requests = response.data.eventRequests?.receivedEventConnectionRequest || [];
      setEventRequests(requests);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveEvent = async (eventId) => {
    try {
      await axios.put(
        'http://localhost:5000/api/events/leave-event',
        { eventId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      fetchMyEvents();
      alert('Left event successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave event');
    }
  };
  const handleDeleteEvent = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(
      'http://localhost:5000/api/events/delete-event',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { eventId }  // Send data in the 'data' property for DELETE requests
      }
    );
    fetchMyEvents();
    alert('Event deleted successfully');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete event');
  }
};

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setNewEvent({
      name: event.name,
      description: event.description || '',
      isPrivate: event.isPrivate,
      eventDate: event.eventDate ? event.eventDate.split('.')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleUpdateEvent = async () => {
    if (!eventToEdit?._id) return;

    try {
      await axios.patch(
        `http://localhost:5000/api/events/update-event-info/${eventToEdit._id}`,
        {
          name: newEvent.name,
          description: newEvent.description,
          isPrivate: newEvent.isPrivate,
          eventDate: newEvent.eventDate
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setShowEditModal(false);
      setEventToEdit(null);
      fetchMyEvents();
      alert('Event updated successfully!');
    } catch (err) {
      setCreateEventError(err.response?.data?.message || 'Failed to update event');
    }
  };


  const handleJoinEvent = async (event) => {
    setSelectedEvent(event);
    const event_id = event._id;
    let endpoint = '';

    try {
      if (event.isPrivate) {
        endpoint = `http://localhost:5000/api/events/get-connections-for-event-request/${event_id}`;
      } else {
        endpoint = `http://localhost:5000/api/events/get-suggestion-for-event-request/${event_id}`;
      }

      const response = await axios.get(`${endpoint}?page=1&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let users = [];
      if (response.data.nonFriends) {
        users = response.data.nonFriends;
      } else if (response.data.friends) {
        users = response.data.friends;
      } else {
        throw new Error('Unexpected API response format');
      }

      const usersWithState = users.map(user => ({
        ...user,
        isSending: false,
        isSent: false
      }));

      setUsersList(usersWithState);
      setShowUserSelectionModal(true);

    } catch (err) {
      console.error("Error fetching users:", err);
      alert(err.response?.data?.message || err.message || 'Failed to fetch users');
    }
  };
 const handelAccecptInvitation = async (event) => {
    setSelectedEvent(event);
    const event_id = event._id;
    
    try {
        const response = await axios.put(
            `http://localhost:5000/api/events/accept-event-connection-request-sendby-creator`,
            {  // Request body/data
                eventId: event_id,
            },
            {  // Config object
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Handle successful response here
        console.log("Invitation accepted:", response.data);
        
    } catch (err) {
        console.error("Error accepting invitation:", err);
        alert(err.response?.data?.message || err.message || 'Failed to accept invitation');
    }
};

  const handleSendRequest = async (receiverId) => {
    if (!selectedEvent) return;

    try {
      setUsersList(prev => prev.map(user =>
        user._id === receiverId ? { ...user, isSending: true } : user
      ));

      await axios.put(
        'http://localhost:5000/api/events/send-event-connection-request-by-creator',
        {
          eventId: selectedEvent._id,
          senderId: receiverId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setUsersList(prev => prev.map(user =>
        user._id === receiverId ? { ...user, isSending: false, isSent: true } : user
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send connection request');
      setUsersList(prev => prev.map(user =>
        user._id === receiverId ? { ...user, isSending: false } : user
      ));
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name) {
      setCreateEventError('Event name is required');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/events/create-event',
        {
          name: newEvent.name,
          description: newEvent.description,
          isPrivate: newEvent.isPrivate,
          eventDate: newEvent.eventDate
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setShowCreateModal(false);
      setNewEvent({
        name: '',
        description: '',
        isPrivate: true,
        eventDate: ''
      });
      setCreateEventError('');
      fetchMyEvents();
      alert('Event created successfully!');
    } catch (err) {
      setCreateEventError(err.response?.data?.message || 'Failed to create event');
    }
  };

  const renderEventList = (events, isMyEvent = false) => (
    <div className="channels-list">
      {events.length > 0 ? (
        events.map((event) => (
          <div key={event._id} className="channel-item">
            <div 
              className="channel-info" 
              onClick={() => openChatModal(event)}
              style={{ cursor: 'pointer' }}
            >
              <h3>{event.name}</h3>
              {event.isPrivate && <span className="private-badge">Private</span>}
              <p className="channel-description">
                {event.description || 'No description'}
              </p>
              {event.eventDate && (
                <p className="event-date">
                  Date: {new Date(event.eventDate).toLocaleString()}
                </p>
              )}
              <p className="event-members">
                Members: {event.members?.length || 0}
              </p>
              <p className="event-creator">
                Created by: {event.createdBy === userId ? 'You' : 'Other user'}
              </p>
            </div>
            <div className="channel-actions">
              <button
                className="join-btn"
                onClick={(e) => {
                  handleJoinEvent(event)
                }}
              >
                Add members
              </button>
              {isMyEvent && event.createdBy === userId && (
                <>
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEvent(event);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="leave-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveEvent(event._id);
                    }}
                  >
                    Leave
                  </button>
                  <button
                    className="leave-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event._id);
                    }}
                  >
                    Delete Event
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="no-channels-message">
          {isMyEvent
            ? 'You are not a member of any events yet.'
            : 'No event requests available.'}
          <br />
          {isMyEvent && (
            <button
              className="discover-btn"
              onClick={() => navigate('/discover-events')}
            >
              Discover Events
            </button>
          )}
        </div>
      )}
    </div>
  );
  const renderRequestEventList = (events, isMyEvent = false) => (
    <div className="channels-list">
      {events.length > 0 ? (
        events.map((event) => (
          <div key={event._id} className="channel-item">
            <div 
              className="channel-info" 
              onClick={() => openChatModal(event)}
              style={{ cursor: 'pointer' }}
            >
              <h3>{event.name}</h3>
              {event.isPrivate && <span className="private-badge">Private</span>}
              <p className="channel-description">
                {event.description || 'No description'}
              </p>
              {event.eventDate && (
                <p className="event-date">
                  Date: {new Date(event.eventDate).toLocaleString()}
                </p>
              )}
              <p className="event-members">
                Members: {event.members?.length || 0}
              </p>
              <p className="event-creator">
                Created by: {event.createdBy === userId ? 'You' : 'Other user'}
              </p>
            </div>
            <div className="channel-actions">
              <button
                className="join-btn"
                onClick={(e) => {
                  handelAccecptInvitation(event)
                }}
              >
                Accecpt invitation 
              </button>
              {isMyEvent && event.createdBy === userId && (
                <>
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEvent(event);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="leave-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveEvent(event._id);
                    }}
                  >
                    Leave
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="no-channels-message">
          {isMyEvent
            ? 'You are not a member of any events yet.'
            : 'No event requests available.'}
          <br />
          {isMyEvent && (
            <button
              className="discover-btn"
              onClick={() => navigate('/discover-events')}
            >
              Discover Events
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div>Error: {error}</div>
        <button onClick={() => { fetchMyEvents(); fetchEventRequests(); }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="channel-page-container">
      <Navbar />

      <div className="channel-page-layout">
        <div className="side-navigation">
          <div className="nav-section">
            <h3>Event Actions</h3>
            <ul>
              <li>
                <button
                  className="nav-link-button"
                  onClick={() => setShowCreateModal(true)}
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
              <li>
                <a href="/my-pending-requests">My Pending Requests</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="main-content">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="channels-section">
            <div className="channel-category">
              <h2>My Events</h2>
              {renderEventList(myEvents, true)}
            </div>
            <div className="channel-category">
              <h2>Event Requests</h2>
              {renderRequestEventList(eventRequests, false)}
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateEventError('');
                }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {createEventError && (
                <div className="error-message">{createEventError}</div>
              )}

              <div className="form-group">
                <label htmlFor="event-name">Event Name*</label>
                <input
                  id="event-name"
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="Enter event name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-description">Description</label>
                <textarea
                  id="event-description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Enter event description (optional)"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-date">Event Date</label>
                <input
                  id="event-date"
                  type="datetime-local"
                  value={newEvent.eventDate}
                  onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newEvent.isPrivate}
                    onChange={(e) => setNewEvent({ ...newEvent, isPrivate: e.target.checked })}
                  />
                  Private Event
                </label>
                <small className="hint">
                  {newEvent.isPrivate
                    ? 'Users will need to request to join'
                    : 'Anyone can join without approval'}
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateEventError('');
                }}
              >
                Cancel
              </button>
              <button
                className="create-button"
                onClick={handleCreateEvent}
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Event</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowEditModal(false);
                  setCreateEventError('');
                }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {createEventError && (
                <div className="error-message">{createEventError}</div>
              )}

              <div className="form-group">
                <label htmlFor="edit-event-name">Event Name*</label>
                <input
                  id="edit-event-name"
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="Enter event name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-event-description">Description</label>
                <textarea
                  id="edit-event-description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Enter event description (optional)"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-event-date">Event Date</label>
                <input
                  id="edit-event-date"
                  type="datetime-local"
                  value={newEvent.eventDate}
                  onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                {/* <label>
                  <input
                    type="checkbox"
                    checked={newEvent.isPrivate}
                    onChange={(e) => setNewEvent({ ...newEvent, isPrivate: e.target.checked })}
                  />
                  Private Event
                </label> */}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowEditModal(false);
                  setCreateEventError('');
                }}
              >
                Cancel
              </button>
              <button
                className="create-button"
                onClick={handleUpdateEvent}
              >
                Update Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Selection Modal */}
      {showUserSelectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Select Users to Connect</h2>
              <button
                className="close-button"
                onClick={() => {
                  setShowUserSelectionModal(false);
                  setSelectedEvent(null);
                }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="users-list">
                {usersList.map(user => (
                  <div key={user._id} className="user-item">
                    <div className="user-info">
                      <h4>{user.name || user.username}</h4>
                      <p>{user.bio || 'No bio available'}</p>
                    </div>
                    <button
                      className={`send-request-btn ${user.isSent ? 'sent' : ''}`}
                      onClick={() => handleSendRequest(user._id)}
                      disabled={user.isSending || user.isSent}
                    >
                      {user.isSending ? 'Sending...' :
                        user.isSent ? 'Request Sent' : 'Send Request'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowUserSelectionModal(false);
                  setSelectedEvent(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Chat Modal */}
      {isChatModalOpen && selectedChatEvent && (
        <EventChatModal
          event={selectedChatEvent}
          onClose={closeChatModal}
          currentUserId={userId}
        />
      )}
    </div>
  );
};

export default EventPage;