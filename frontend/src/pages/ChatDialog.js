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
  
  const handleGetMessages=(chat)=>{
    
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
  
  }

  useEffect(() => {
    const interval = setInterval(() => {
    handleGetMessages(chat)
    }, 100); // every 10 seconds
  
    return () => clearInterval(interval); // cleanup
    
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
      handleGetMessages(chat);
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
  {messages.map((msg, idx) => {
    const isOther = chat._id === msg.sender;

    return (
      <div key={idx} className={`message-wrapper ${isOther ? 'other' : 'own'}`}>
        <div className={`message-bubble ${isOther ? 'other' : 'own'}`}>
          <p>{msg.message}</p>
          {msg.timestamp && (
            <div className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>
    );
  })}
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
