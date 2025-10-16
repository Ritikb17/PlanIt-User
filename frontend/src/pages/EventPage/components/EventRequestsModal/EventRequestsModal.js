import React from 'react';
import './EventRequestsModal.css';

const EventRequestsModal = ({
  isOpen,
  onClose,
  event,
  onAcceptRequest,
  onRejectRequest
}) => {
  if (!isOpen || !event) return null;

  const hasRequests = event.recivedRequest && event.recivedRequest.length > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content event-requests-modal">
        <div className="modal-header">
          <h2>Event Join Requests - {event.name}</h2>
          <button
            className="close-button"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {hasRequests ? (
            <div className="requests-list">
              {event.recivedRequest.map((user) => (
                <div key={user._id} className="request-item">
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <div className="request-actions">
                    <button
                      className="accept-btn"
                      onClick={() => onAcceptRequest(event._id, user._id)}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => onRejectRequest(event._id, user._id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-requests-message">
              <p>No pending requests for this event.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="cancel-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventRequestsModal;