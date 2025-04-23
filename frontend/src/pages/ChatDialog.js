import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatDialog.css';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token') 
  },
  transports: ['websocket'],
  

});

const ChatDialog = ({ chat, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!chat?._id) return;
  
    socket.emit('get-messages', chat._id, (response) => {
      if (response.status === 'success') {
        console.log("Initial messages received:", response.messages);
        setMessages(response.messages);
      } else {
        console.error("Error getting messages:", response.message);
      }
    });
  
    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
  
    socket.on('receive-message', handleReceiveMessage);
  
    return () => {
      socket.off('receive-message', handleReceiveMessage);
    };
  }, [chat._id]);
  

  const handleSend = () => {


    console.log("TOKEN IS  ", localStorage.getItem('token'));
    if (input.trim()) {
      const message = {
        senderId: '', 
        receiverId: chat._id,
        message: input
      };

      socket.emit('send-message', message);
      setMessages((prev) => [...prev, { ...message, self: true }]);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

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
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.self ? 'own' : 'other'}`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-dialog-footer">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="message-input"
          />
          <button className="send-button" onClick={handleSend}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;
