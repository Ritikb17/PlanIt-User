import React from 'react';
import './EventItem.css';

const EventItem = ({
  event,
  onJoinEvent,
  onEditEvent,
  onLeaveEvent,
  onDeleteEvent,
  onAcceptInvitation,
  onOpenChat,
  isMyEvent = false,
  isRequestList = false
}) => {
  const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;
  const isCreator = event.createdBy === userId;

  return (
    <div className="event-item">
      <div
        className="event-info"
        onClick={() => onOpenChat && onOpenChat(event)}
        style={{ cursor: onOpenChat ? 'pointer' : 'default' }}
      >
        <div className="event-header">
          <h3>{event.name}</h3>
          {event.isPrivate && <span className="private-badge">Private</span>}
        </div>
        
        <p className="event-description">
          {event.description || 'No description'}
        </p>
        
        <div className="event-details">
          {event.eventDate && (
            <div className="event-detail">
              <span className="detail-label">Date:</span>
              <span className="detail-value">
                {new Date(event.eventDate).toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="event-detail">
            <span className="detail-label">Members:</span>
            <span className="detail-value">{event.members?.length || 0}</span>
          </div>
          
          <div className="event-detail">
            <span className="detail-label">Created by:</span>
            <span className="detail-value">{isCreator ? 'You' : 'Other user'}</span>
          </div>
        </div>
      </div>
      
      <div className="event-actions">
        {isRequestList ? (
          <button
            className="accept-btn"
            onClick={() => onAcceptInvitation(event)}
          >
            Accept invitation
          </button>
        ) : (
          <>
            <button
              className="join-btn"
              onClick={() => onJoinEvent(event)}
            >
              Add members
            </button>
            {/* <button
              className="join-btn"
              onClick={() => onJoinEvent(event)}
            >
              View requests
            </button> */}
            {isMyEvent && isCreator && (
              <>
                <button
                  className="edit-btn"
                  onClick={() => onEditEvent(event)}
                >
                  Edit
                </button>
                <button
                  className="leave-btn"
                  onClick={() => onLeaveEvent(event._id)}
                >
                  Leave
                </button>
                <button
                  className="delete-btn"
                  onClick={() => onDeleteEvent(event._id)}
                >
                  Delete
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventItem;