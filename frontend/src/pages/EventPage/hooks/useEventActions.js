import { useState } from 'react';
import axios from 'axios';

export const useEventActions = ({
  fetchMyEvents,
  fetchEventRequests,
  setShowEditModal,
  setShowUserSelectionModal
}) => {
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    location: '',
    isPrivate: false,
    eventDate: '',
    applicationDeadline: '',
    totalMembersAllowed: -1,
    isLimitedMemberEvent: false
  });
  const [createEventError, setCreateEventError] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [eventToEdit, setEventToEdit] = useState(null); // ← Add this
  const [selectedEvent, setSelectedEvent] = useState(null); // ← Add this

  const token = localStorage.getItem('token');
  const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;

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
      await axios.delete(
        'http://localhost:5000/api/events/delete-event',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: { eventId }
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

  const handleAcceptInvitation = async (event) => {
    setSelectedEvent(event);
    const event_id = event._id;

    try {
      await axios.put(
        `http://localhost:5000/api/events/accept-event-connection-request-sendby-creator`,
        { eventId: event_id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Invitation accepted");
      fetchEventRequests();
      alert('Invitation accepted successfully!');
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
      alert('Event name is required');
      return;
    }
    if (!newEvent.eventDate) {
      setCreateEventError('Event date is required');
      alert('Event date is required');
      return;
    }
    if (!newEvent.applicationDeadline) {
      setCreateEventError('Application deadline is required');
      alert('Application deadline is required');
      return;
    }

    if (new Date(newEvent.applicationDeadline) >= new Date(newEvent.eventDate)) {
      setCreateEventError('Application deadline must be before the event date');
      alert('Application deadline must be before the event date');
      return;
    }

    if (newEvent.isLimitedMemberEvent && (!newEvent.totalMembersAllowed || newEvent.totalMembersAllowed < 1)) {
      setCreateEventError('Member limit must be at least 1 when enabled');
      return;
    }

    try {
      await axios.post(
        'http://localhost:5000/api/events/create-event',
        {
          name: newEvent.name,
          description: newEvent.description,
          isPrivate: newEvent.isPrivate,
          eventDate: newEvent.eventDate,
          location: newEvent.location,
          applicationDeadline: newEvent.applicationDeadline,
          isLimitedMemberEvent: newEvent.isLimitedMemberEvent,
          totalMembersAllowed: newEvent.isLimitedMemberEvent 
            ? newEvent.totalMembersAllowed 
            : -1
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setCreateEventError('');
      fetchMyEvents();
      alert('Event created successfully!');
      return true;
    } catch (err) {
      console.error('Event creation error:', err);
      setCreateEventError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Failed to create event. Please try again.'
      );
      return false;
    }
  };

  return {
    handleLeaveEvent,
    handleDeleteEvent,
    handleEditEvent,
    handleUpdateEvent,
    handleJoinEvent,
    handleAcceptInvitation,
    handleSendRequest,
    handleCreateEvent,
    newEvent,
    setNewEvent,
    createEventError,
    setCreateEventError,
    usersList,
    setUsersList,
    eventToEdit, // ← Return these if needed by parent
    setEventToEdit, // ← Return setter
    selectedEvent, // ← Return these if needed by parent
    setSelectedEvent, // ← Return setter
    userId
  };
};