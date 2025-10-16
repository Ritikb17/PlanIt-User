import React from 'react';
import './UserSelectionModal.css';

const UserSelectionModal = ({
  isOpen,
  onClose,
  usersList,
  onSendRequest,
  selectedEvent
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Select Users to Connect</h2>
          <button
            className="close-button"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {selectedEvent && (
            <div className="selected-event-info">
              <h4>Event: {selectedEvent.name}</h4>
            </div>
          )}
          
          <div className="users-list">
            {usersList.length > 0 ? (
              usersList.map(user => (
                <div key={user._id} className="user-item">
                  <div className="user-info">
                    <h4>{user.name || user.username}</h4>
                    <p>{user.bio || 'No bio available'}</p>
                  </div>
                  <button
                    className={`send-request-btn ${user.isSent ? 'sent' : ''}`}
                    onClick={() => onSendRequest(user._id)}
                    disabled={user.isSending || user.isSent}
                  >
                    {user.isSending ? 'Sending...' :
                      user.isSent ? 'Request Sent' : 'Send Request'}
                  </button>
                </div>
              ))
            ) : (
              <div className="no-users-message">
                No users available to connect.
              </div>
            )}
          </div>
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

export default UserSelectionModal;