import React from 'react';
import './CreateEventModal.css';

const CreateEventModal = ({
  isOpen,
  onClose,
  newEvent,
  setNewEvent,
  onCreateEvent,
  error
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateEvent();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Event</h2>
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
              <label htmlFor="event-location">Location</label>
              <input
                id="event-location"
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Enter event location (optional)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-date">Event Date*</label>
              <input
                id="event-date"
                type="datetime-local"
                value={newEvent.eventDate}
                onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="application-deadline">Application Deadline*</label>
              <input
                id="application-deadline"
                type="datetime-local"
                value={newEvent.applicationDeadline}
                onChange={(e) => setNewEvent({ ...newEvent, applicationDeadline: e.target.value })}
                required
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
              <small className="hint">
                {newEvent.isPrivate
                  ? 'Users will need to request to join'
                  : 'Anyone can join without approval'}
              </small>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newEvent.isLimitedMemberEvent}
                  onChange={(e) => setNewEvent({
                    ...newEvent,
                    isLimitedMemberEvent: e.target.checked,
                    totalMembersAllowed: e.target.checked ? 10 : -1
                  })}
                />
                <span className="checkmark"></span>
                Limit Number of Members
              </label>
              {newEvent.isLimitedMemberEvent && (
                <div className="form-subgroup">
                  <label htmlFor="total-members">Maximum Members</label>
                  <input
                    id="total-members"
                    type="number"
                    min="1"
                    value={newEvent.totalMembersAllowed}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      totalMembersAllowed: parseInt(e.target.value) || 1
                    })}
                  />
                </div>
              )}
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
              disabled={!newEvent.name || !newEvent.eventDate || !newEvent.applicationDeadline}
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;