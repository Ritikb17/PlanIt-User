import React from 'react';
import './EditEventModal.css';

const EditEventModal = ({
  isOpen,
  onClose,
  eventToEdit,
  newEvent,
  setNewEvent,
  onUpdateEvent,
  error
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateEvent();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Event</h2>
          <button
            className="close-button"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-message">{error}</div>
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

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newEvent.isPrivate}
                  onChange={(e) => setNewEvent({ ...newEvent, isPrivate: e.target.checked })}
                />
                <span className="checkmark"></span>
                Private Event
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-button"
            >
              Update Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;