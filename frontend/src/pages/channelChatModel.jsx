import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
// import './channelChatModal.css';
import io from 'socket.io-client';
import PropTypes from 'prop-types';

const ChannelChatModal = ({ channel, onClose, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');

  // Initialize WebSocket connection and message listeners
  useEffect(() => {
    const newSocket = io('http://localhost:5000', { 
      auth: { token },
      query: { channelId: channel._id }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('join-channel', {
        channelId: channel._id,
        userId: currentUserId,
      });
    });

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    newSocket.on('new-channel-message', (data) => {

      console.log("woring ON")
      if(data.channelId===channel._id )
      {
        console.log("woring ON")
      }
      setMessages(prev => [...prev, {
        ...data.message,
        channelId: data.channelId,
        timestamp: new Date() // Add timestamp on client side if not sent from server
      }]);
    });

    // Clean up on unmount
   






    setSocket(newSocket);

    return () => {
      newSocket.off('new-message');
      newSocket.off('error');
      newSocket.off('new-channel-message');
      // socket.emit('leave-channel', channelId);
      newSocket.disconnect();
    };
  }, [channel._id, currentUserId, token]);

  // Load existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/messages/channel/${channel._id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [channel._id, token]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      channelId: channel._id,
      message: newMessage,
      sender: currentUserId
    };

    // Optimistic UI update
    const tempMessage = {
      ...messageData,
      _id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      sender: { _id: currentUserId, name: 'You' }
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      // Send via WebSocket
      socket.emit('send-message-to-channel', messageData, (response) => {
        if (response.status === 'success') {
          // Replace temp message with server-generated one

            console.log("return success");
          // setMessages((prev) =>
          //   prev.map((msg) => 
          //     msg._id === newMessage._id ? response.message : msg
          //   )
          // );
        } else {
          // Rollback if failed
          // setMessages((prev) => prev.filter((msg) => msg._id !== newMessage._id));
        }
      });
      
      // Fallback HTTP request if needed
      // await axios.post(
      //   `http://localhost:5000/api/messages/channel/${channel._id}`,
      //   messageData,
      //   { headers: { 'Authorization': `Bearer ${token}` } }
      // );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
    }
  }, [newMessage, socket, channel._id, currentUserId]);

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

ChannelChatModal.propTypes = {
  channel: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
};

export default ChannelChatModal;