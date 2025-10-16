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
  isMyEvent = false,
  isRequestList = false
}) => {
  if (events.length === 0) {
    return (
      <div className="no-events-message">
        {isMyEvent
          ? 'You are not a member of any events yet.'
          : 'No event requests available.'}
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
          isMyEvent={isMyEvent}
          isRequestList={isRequestList}
        />
      ))}
    </div>
  );
};

export default EventList;