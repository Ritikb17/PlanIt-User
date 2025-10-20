import { useState, useEffect } from 'react';
import axios from 'axios';

export const useEvents = () => {
  const [myEvents, setMyEvents] = useState([]);
  const [eventRequests, setEventRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  const fetchMyEvents = async () => {
    if (!token) {
      console.error("No token available");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/events/get-my-events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const events = response.data.events.connectedEvents;
      setMyEvents(events);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error("API Error:", err.response?.data || err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/events/get-event-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Fetched Event Request in hook ', response.data.eventRequests);
     const requests = response.data.eventRequests || [];

      console.log('Processed Event Requests:', requests);
      setEventRequests(requests);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
    fetchEventRequests();
  }, []);

  return {
    myEvents,
    eventRequests,
    loading,
    error,
    fetchMyEvents,
    fetchEventRequests
  };
};