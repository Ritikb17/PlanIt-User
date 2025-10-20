import React, { useState } from 'react';
import { useEvents } from './hooks/useEvents';
import {  useEventActions } from './hooks/useEventActions';
import Navbar from '../../components/Navbar';
import EventChatModal from '../eventChatModel';
import SideNavigation from './components/SideNavigation';
import EventList from './components/EventList';
import CreateEventModal from './components/CreateEventModal';
import EditEventModal from './components/EditEventModal';
import UserSelectionModal from './components/UserSelectionModal';
import EventRequestsModal from './components/EventRequestsModal';
import './EventPage.css';

const EventPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedChatEvent, setSelectedChatEvent] = useState(null);
  const [selectedEventForRequests, setSelectedEventForRequests] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const {
    myEvents,
    eventRequests,
    loading,
    error,
    fetchMyEvents,
    fetchEventRequests
  } = useEvents();

  const {
    handleLeaveEvent,
    handleDeleteEvent,
    handleEditEvent,
    handleUpdateEvent,
    handleJoinEvent,
    handleAcceptInvitation,
    handleSendRequest,
    handleCreateEvent,
    handleAcceptRequest,
    handleRejectRequest,
    newEvent,
    setNewEvent,
    createEventError,
    setCreateEventError,
    usersList,
    setUsersList,
    userId
  } = useEventActions({
    fetchMyEvents,
    fetchEventRequests,
    setShowEditModal,
    setShowUserSelectionModal,
    setEventToEdit,
    setSelectedEvent
  });

  // Handler for viewing requests
  const handleViewRequests = (event) => {
    setSelectedEventForRequests(event);
    setShowRequestsModal(true);
  };

  const openChatModal = (event) => {
    setSelectedChatEvent(event);
    setIsChatModalOpen(true);
  };

  const closeChatModal = () => {
    setIsChatModalOpen(false);
    setSelectedChatEvent(null);
  };

  const filteredMyEvents = myEvents.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEventRequests = eventRequests.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  console.log('event respons',filteredEventRequests)

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
    <div className="event-page-container">
      <Navbar />

      <div className="event-page-layout">
        <SideNavigation onCreateEvent={() => setShowCreateModal(true)} />

        <div className="main-content">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="events-section">
            <div className="event-category">
              <h2>My Events</h2>
              <EventList
                events={filteredMyEvents}
                onJoinEvent={handleJoinEvent}
                onEditEvent={handleEditEvent}
                onLeaveEvent={handleLeaveEvent}
                onDeleteEvent={handleDeleteEvent}
                onOpenChat={openChatModal}
                onViewRequests={handleViewRequests}
                isMyEvent={true}
              />
            </div>

            <div className="event-category">
              <h2>Event Requests</h2>
              <EventList
                events={filteredEventRequests}
                onAcceptInvitation={handleAcceptInvitation}
                isRequestList={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateEventError('');
          setNewEvent({
            name: '',
            description: '',
            location: '',
            isPrivate: false,
            eventDate: '',
            applicationDeadline: '',
            totalMembersAllowed: -1,
            isLimitedMemberEvent: false
          });
        }}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onCreateEvent={handleCreateEvent}
        error={createEventError}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setCreateEventError('');
        }}
        eventToEdit={eventToEdit}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onUpdateEvent={handleUpdateEvent}
        error={createEventError}
      />

      {/* User Selection Modal */}
      <UserSelectionModal
        isOpen={showUserSelectionModal}
        onClose={() => {
          setShowUserSelectionModal(false);
          setSelectedEvent(null);
        }}
        usersList={usersList}
        onSendRequest={handleSendRequest}
        selectedEvent={selectedEvent}
      />

      {/* Event Requests Modal */}
      <EventRequestsModal
        isOpen={showRequestsModal}
        onClose={() => {
          setShowRequestsModal(false);
          setSelectedEventForRequests(null);
        }}
        event={selectedEventForRequests}
        onAcceptRequest={handleAcceptRequest}
        onRejectRequest={handleRejectRequest}
      />

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