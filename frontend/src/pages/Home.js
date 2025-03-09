import React, { useState } from 'react';
import './Home.css'; // Import the CSS file
import ChatDialog from './ChatDialog'; // Import the ChatDialog component

const Home = () => {
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('event'); // 'event' or 'post'
  const [eventForm, setEventForm] = useState({
    eventName: '',
    eventDateTime: '',
    eventLocation: '',
    isPublic: true, // Default to public
  });
  const [postForm, setPostForm] = useState({
    caption: '',
    picture: null, // Store the uploaded picture file
  });
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (modalMode === 'event') {
      setEventForm({
        ...eventForm,
        [name]: type === 'radio' ? value === 'true' : value, // Convert string to boolean
      });
    } else {
      setPostForm({
        ...postForm,
        [name]: type === 'file' ? e.target.files[0] : value,
      });
    }
    console.log('Updated Form:', modalMode === 'event' ? eventForm : postForm); // Debugging
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'event') {
      // Save the event to localStorage
      const newEvent = { ...eventForm, id: Date.now() }; // Add a unique ID
      const savedEvents = JSON.parse(localStorage.getItem('events')) || [];
      savedEvents.push(newEvent);
      localStorage.setItem('events', JSON.stringify(savedEvents));

      console.log('Event Data:', newEvent);
    } else {
      // Handle post form submission
      console.log('Post Data:', postForm);
    }
    setIsEventsModalOpen(false); // Close the modal after submission
  };

  // Open chat dialog
  const openChatDialog = (chat) => {
    setSelectedChat(chat);
    setIsChatDialogOpen(true);
  };

  // Close chat dialog
  const closeChatDialog = () => {
    setIsChatDialogOpen(false);
    setSelectedChat(null);
  };

  // Dummy feed data with profile pictures
  const feed = [
    {
      id: 1,
      username: 'JohnDoe',
      profilePicture: 'https://via.placeholder.com/40',
      content: 'This is a sample post!',
      likes: 10,
      shares: 5,
    },
    {
      id: 2,
      username: 'JaneDoe',
      profilePicture: 'https://via.placeholder.com/40',
      content: 'Another post here!',
      likes: 15,
      shares: 3,
    },
    // Add more posts as needed
  ];

  // Dummy chat data with profile pictures
  const chats = Array.from({ length: 10 }).map((_, index) => ({
    id: index + 1,
    username: 'Jane Doe',
    profilePicture: 'https://via.placeholder.com/40',
  }));

  // Dummy group data with profile pictures
  const groups = Array.from({ length: 10 }).map((_, index) => ({
    id: index + 1,
    username: 'Jane Doe',
    profilePicture: 'https://via.placeholder.com/40',
  }));

  return (
    <div className="homepage">
      {/* Chat Section */}
      <div className="chat-section">
        <h3>Chats</h3>
        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="chat-item"
              onClick={() => openChatDialog(chat)}
            >
              <img
                src={chat.profilePicture}
                alt={chat.username}
                className="profile-picture"
              />
              <p>{chat.username}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feed Section */}
      <div className="feed">
        {feed.map((post) => (
          <div key={post.id} className="post">
            <div className="post-header">
              <img
                src={post.profilePicture}
                alt={post.username}
                className="profile-picture"
              />
              <h3>{post.username}</h3>
            </div>
            <div className="post-content">
              <p>{post.content}</p>
            </div>
            <div className="post-actions">
              <button className="like-btn">
                <i className="fas fa-thumbs-up"></i> {post.likes}
              </button>
              <button className="share-btn">
                <i className="fas fa-share"></i> {post.shares}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Groups Section */}
      <div className="groups-section">
        <h3>Groups</h3>
        <div className="chat-list">
          {groups.map((group) => (
            <div
              key={group.id}
              className="chat-item"
              onClick={() => openChatDialog(group)}
            >
              <img
                src={group.profilePicture}
                alt={group.username}
                className="profile-picture"
              />
              <p>{group.username}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Events Button */}
      <div className="events-button" onClick={() => setIsEventsModalOpen(true)}>
        <i className="fas fa-calendar-alt"></i>
      </div>

      {/* Events Modal */}
      {isEventsModalOpen && (
        <div className="events-modal">
          <div className="modal-overlay" onClick={() => setIsEventsModalOpen(false)}></div>
          <div className="modal-content">
            {/* Switch Selection */}
            <div className="mode-switch">
              <button
                className={`mode-button ${modalMode === 'event' ? 'active' : ''}`}
                onClick={() => setModalMode('event')}
              >
                Create Event
              </button>
              <button
                className={`mode-button ${modalMode === 'post' ? 'active' : ''}`}
                onClick={() => setModalMode('post')}
              >
                Create Post
              </button>
            </div>

            {/* Event Form */}
            {modalMode === 'event' && (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="eventName">Event Name</label>
                  <input
                    type="text"
                    id="eventName"
                    name="eventName"
                    value={eventForm.eventName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="eventDateTime">Event Date and Time</label>
                  <input
                    type="datetime-local"
                    id="eventDateTime"
                    name="eventDateTime"
                    value={eventForm.eventDateTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="eventLocation">Event Location</label>
                  <input
                    type="text"
                    id="eventLocation"
                    name="eventLocation"
                    value={eventForm.eventLocation}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Event Visibility</label>
                  <div className="visibility-options">
                    <label>
                      <input
                        type="radio"
                        name="isPublic"
                        value="true"
                        checked={eventForm.isPublic === true}
                        onChange={handleInputChange}
                      />
                      Public
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="isPublic"
                        value="false"
                        checked={eventForm.isPublic === false}
                        onChange={handleInputChange}
                      />
                      Private
                    </label>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="submit-button">
                    Create Event
                  </button>
                  <button
                    type="button"
                    className="close-button"
                    onClick={() => setIsEventsModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </form>
            )}

            {/* Post Form */}
            {modalMode === 'post' && (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="caption">Caption</label>
                  <textarea
                    id="caption"
                    name="caption"
                    value={postForm.caption}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="picture">Upload Picture</label>
                  <input
                    type="file"
                    id="picture"
                    name="picture"
                    onChange={handleInputChange}
                    accept="image/*"
                    required
                  />
                  {postForm.picture && (
                    <p>Selected File: {postForm.picture.name}</p>
                  )}
                </div>
                <div className="modal-actions">
                  <button type="submit" className="submit-button">
                    Create Post
                  </button>
                  <button
                    type="button"
                    className="close-button"
                    onClick={() => setIsEventsModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Chat Dialog */}
      {isChatDialogOpen && (
        <ChatDialog chat={selectedChat} onClose={closeChatDialog} />
      )}
    </div>
  );
};

export default Home;