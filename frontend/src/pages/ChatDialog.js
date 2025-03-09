import React from 'react';
import './ChatDialog.css'; // Import the CSS file

const ChatDialog = ({ chat, onClose }) => {
  return (
    <div className="chat-dialog-overlay">
      <div className="chat-dialog">
        <div className="chat-dialog-header">
          <img
            src={chat.profilePicture}
            alt={chat.username}
            className="profile-picture"
          />
          <h3>{chat.username}</h3>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="chat-dialog-body">
          {/* Chat messages will go here */}
          <p>This is a sample message.</p>
        </div>
        <div className="chat-dialog-footer">
          <input
            type="text"
            placeholder="Type a message..."
            className="message-input"
          />
          <button className="send-button">
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;