// ChannelChatModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './channelChatModel.css'
import io from 'socket.io-client'; // Make sure to install socket.io-client

const ChannelChatModal = ({ channel, onClose, currentUserId, token }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000', { // Replace with your server URL
      auth: { token },
      query: { channelId: channel._id }
    });

    setSocket(newSocket);

    // Load existing messages
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/messages/channel/${channel._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Set up socket listeners
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [channel._id, token]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        channel: channel._id,
        content: newMessage,
        sender: currentUserId
      };

      // Optimistic UI update
      const tempMessage = {
        ...messageData,
        _id: Date.now().toString(), // Temporary ID
        createdAt: new Date().toISOString(),
        sender: { _id: currentUserId, name: 'You' } // Simplified sender info
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');

      // Send via WebSocket
      socket.emit('sendMessage', messageData);

      // Also send via HTTP as fallback
      await axios.post(
        'http://localhost:5000/api/messages',
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic update if failed
    //   setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="chat-modal-content">
        <div className="chat-modal-header">
          <h2>#{channel.name}</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <div className="chat-modal-body">
          {isLoading ? (
            <div className="loading-messages">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            <div className="messages-container">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`message ${message.sender._id === currentUserId ? 'sent' : 'received'}`}
                >
                  {message.sender._id !== currentUserId && (
                    <span className="sender-name">{message.sender.name}</span>
                  )}
                  <div className="message-content">{message.content}</div>
                  <div className="message-time">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="chat-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelChatModal;