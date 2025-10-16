import React from 'react';
import EventItem from '../EventItem';
import './EventList.css';

const EventList = ({
  events,
  onJoinEvent,
  onEditEvent,
  onLeaveEvent,
  onDeleteEvent,
  onAcceptInvitation,
  onOpenChat,
  onViewRequests, // ← Add this prop
  isMyEvent = false,
  isRequestList = false
}) => {
  if (events.length === 0) {
    return (
      <div className="no-events-message">
        {isMyEvent
          ? 'You are not a member of any events yet.'
          : 'No event requests available.'}
        {isMyEvent && (
          <button
            className="discover-btn"
            onClick={() => window.location.href = '/discover-events'}
          >
            Discover Events
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="events-list">
      {events.map((event) => (
        <EventItem
          key={event._id}
          event={event}
          onJoinEvent={onJoinEvent}
          onEditEvent={onEditEvent}
          onLeaveEvent={onLeaveEvent}
          onDeleteEvent={onDeleteEvent}
          onAcceptInvitation={onAcceptInvitation}
          onOpenChat={onOpenChat}
          onViewRequests={onViewRequests} // ← Pass to EventItem
          isMyEvent={isMyEvent}
          isRequestList={isRequestList}
        />
      ))}
    </div>
  );
};

export default EventList;