import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import '../pages/channelChatModel.css';

const EventChatModel = ({ event, onClose, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token'),
      },
      transports: ['websocket'],
      query: { eventId: event._id }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
      socket.emit('join-event', {
        eventId: event._id,
        userId: currentUserId,
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Load initial messages
    socket.emit('get-message-of-the-event', 
      { eventId: event._id }, 
      (response) => {
        if (response?.status === 'success') {
          setMessages(response.messages || []);
        } else {
          console.error('Failed to get messages:', response?.message);
        }
      }
    );

    // Message event handlers
    const handleNewMessage = (data) => {
      setMessages(prev => [...prev, data.message]);
    };

    const handleMessageUpdated = (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === data.messageId ? { 
            ...msg, 
            message: data.updatedMessage.message,
            isEdited: data.updatedMessage.isEdited,
            editedAt: data.updatedMessage.editedAt
          } : msg
        )
      );
    };

    const handleMessageDeleted = (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === data.messageId ? { ...msg, isDeleted: true, deletedAt: new Date() } : msg
        )
      );
    };

    socket.on('new-event-message', handleNewMessage);
    socket.on('message-updated', handleMessageUpdated);
    socket.on('message-deleted', handleMessageDeleted);

    return () => {
      socket.off('new-event-message', handleNewMessage);
      socket.off('message-updated', handleMessageUpdated);
      socket.off('message-deleted', handleMessageDeleted);
      socket.emit('leave-event', { eventId: event._id, userId: currentUserId });
      socket.disconnect();
    };
  }, [event._id, currentUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socketRef.current) return;

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      message: input,
      sender: currentUserId,
      timestamp: new Date().toISOString(),
      isTemp: true
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    setInput('');

    // Send to server
    socketRef.current.emit('send-message-to-event', { 
      eventId: event._id,
      message: input
    }, (response) => {
      if (response.status !== 'success') {
        // Mark as failed
        setMessages(prev =>
          prev.map(msg => 
            msg._id === tempMessage._id ? { ...msg, failed: true } : msg
          )
        );
      }
    });
  };

  const handleEdit = (id, currentText) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const handleEditSubmit = () => {
    if (!editText.trim() || !socketRef.current) return;

    socketRef.current.emit('edit-message-of-the-event', { 
      eventId: event._id,
      messageId: editingId,
      message: editText
    }, (response) => {
      if (response.status === 'success') {
        setEditingId(null);
        setEditText('');
        socketRef.current.emit('get-message-of-the-event', 
      { eventId: event._id }, 
      (response) => {
        if (response?.status === 'success') {
          setMessages(response.messages || []);
        } else {
          console.error('Failed to get messages:', response?.message);
        }
      }
    );
      }
    });
  };

  const handleDelete = (id) => {
    if (!socketRef.current || !window.confirm('Are you sure you want to delete this message?')) return;

    socketRef.current.emit('delete-message-of-the-event', { 
      eventId: event._id,
      messageId: id
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingId) {
        handleEditSubmit();
      } else {
        handleSend();
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="channel-chat-modal-overlay">
      <div className="channel-chat-modal">
        <div className="channel-chat-header">
          <h2>Event Chat: {event.name}</h2>
          <div className="connection-status">
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </div>
          <button className="channel-chat-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="channel-chat-body">
          {messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            <div className="messages-container">
              {messages.map((msg) => {
                if (msg.isDeleted && msg.sender !== currentUserId) return null;
                
                const isMine = msg.sender === currentUserId;
                const isDeleted = msg.isDeleted;
                const messageContent = msg.message;

                return (
                  <div 
                    key={msg._id} 
                    className={`message-wrapper ${isMine ? 'own' : 'other'}`}
                  >
                    <div className={`message-bubble ${isMine ? 'own' : 'other'} ${isDeleted ? 'deleted' : ''}`}>
                      {editingId === msg._id ? (
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="edit-input"
                          autoFocus
                        />
                      ) : (
                        <>
                          {isDeleted ? (
                            <p className="deleted-message-text">
                              {isMine ? '[You deleted this message]' : '[Message deleted]'}
                            </p>
                          ) : (
                            <>
                              <p className="message-content">{messageContent}</p>
                              {isMine && (
                                <div className="message-actions">
                                  <button onClick={() => handleEdit(msg._id, messageContent)}>
                                    Edit
                                  </button>
                                  <button onClick={() => handleDelete(msg._id)}>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                      {msg.timestamp && (
                        <div className="message-time">
                          {formatTime(msg.timestamp)}
                          {msg.isEdited && !isDeleted && ' (edited)'}
                          {msg.failed && ' (failed)'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="channel-chat-footer">
          <input
            type="text"
            value={editingId ? editText : input}
            onChange={(e) => editingId ? setEditText(e.target.value) : setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingId ? "Edit your message..." : "Type a message..."}
            disabled={!isConnected}
          />
          {editingId ? (
            <>
              <button onClick={handleEditSubmit} disabled={!editText.trim()}>
                Save
              </button>
              <button onClick={() => { setEditingId(null); setEditText(''); }}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={handleSend} disabled={!input.trim() || !isConnected}>
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventChatModel;