import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import '../pages/channelChatModel.css';

const ChannelChatModal = ({ channel, onClose, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [channelDetails, setChannelDetails] = useState(null);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch channel details
  const fetchChannelInfo = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/channel/get-channel-info?channelId=${channel._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.data) {
        setChannelDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching channel info:', error);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token'),
      },
      transports: ['websocket'],
      query: { channelId: channel._id }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
      socket.emit('join-channel', {
        channelId: channel._id,
        userId: currentUserId,
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Load initial messages
    socket.emit('get-message-of-the-channel', 
      { channelId: channel._id }, 
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
      socket.emit('get-message-of-the-channel', 
        { channelId: channel._id }, 
        (response) => {
          if (response?.status === 'success') {
            setMessages(response.messages || []);
          } else {
            console.error('Failed to get messages:', response?.message);
          }
        }
      );
    };

    const handleMessageEdited = (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === data.messageId ? { 
            ...msg, 
            message: data.message?.message || data.message,
            isEdited: true 
          } : msg
        )
      );
    };

    const handleMessageDeleted = (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === data.messageId ? { ...msg, isDeleted: true } : msg
        )
      );
    };

    const handleNewPoll = (data) => {
      socket.emit('get-message-of-the-channel', 
        { channelId: channel._id }, 
        (response) => {
          if (response?.status === 'success') {
            setMessages(response.messages || []);
          } else {
            console.error('Failed to get messages:', response?.message);
          }
        }
      );
    };

    socket.on('new-channel-message', handleNewMessage);
    socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('new-channel-poll', handleNewPoll);

    return () => {
      socket.off('new-channel-message', handleNewMessage);
      socket.off('message-edited', handleMessageEdited);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('new-channel-poll', handleNewPoll);
      socket.emit('leave-channel', { channelId: channel._id, userId: currentUserId });
      socket.disconnect();
    };
  }, [channel._id, currentUserId]);

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
    socketRef.current.emit('send-message-to-channel', { 
      channelId: channel._id,
      message: input,
      sender: currentUserId
    }, (response) => {
      if (response.status === 'success') {
        setEditingId(null);
        setEditText('');
      }
    });
  };

  const handleEdit = (id, currentText) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const handleEditSubmit = () => {
    if (!editText.trim() || !socketRef.current) return;

    socketRef.current.emit('edit-message-of-the-channel', { 
      channelId: channel._id,
      messageId: editingId,
      message: { message: editText }
    }, (response) => {
      if (response.status === 'success') {
        setEditingId(null);
        setEditText('');
      }
    });
  };

  const handleDelete = (id) => {
    if (!socketRef.current) return;

    socketRef.current.emit('delete-message-of-the-channel', { 
      channelId: channel._id,
      messageId: id
    }, (response) => {
      if (response.status !== 'success') {
        console.log("Failed to delete message");
      }
      else {
        socketRef.current.emit('get-message-of-the-channel', 
          { channelId: channel._id }, 
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

  // Poll related functions
  const handleAddPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleCreatePoll = () => {
    if (!pollTitle.trim() || pollOptions.some(opt => !opt.trim())) {
      alert('Please fill all poll fields');
      return;
    }

    const pollData = {
      channelId: channel._id,
      title: pollTitle,
      options: pollOptions.map(opt => ({ title: opt })),
      allowMultipleChoices,
      createdBy: currentUserId
    };

    socketRef.current.emit('create-channel-poll', pollData, (response) => {
      if (response.status === 'success') {
        setShowPollForm(false);
        setPollTitle('');
        setPollOptions(['', '']);
        setAllowMultipleChoices(false);
      } else {
        console.error('Failed to create poll:', response.message);
      }
    });
  };

  const handleVote = (pollId, optionId) => {
    if (!socketRef.current) return;

    socketRef.current.emit('vote-on-poll', {
      pollId,
      optionId,
      userId: currentUserId
    }, (response) => {
      if (response.status !== 'success') {
        console.error('Failed to vote:', response.message);
      }
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

  const toggleChannelInfo = async () => {
    if (!showChannelInfo) {
      await fetchChannelInfo();
    }
    setShowChannelInfo(!showChannelInfo);
  };

  const renderMessageContent = (msg) => {
    if (msg.isDeleted) {
      return <p className="deleted-message-text">[Message deleted]</p>;
    }

    if (msg.poll) {
      return (
        <div className="poll-message">
          <h4>{msg.poll.title}</h4>
          <ul className="poll-options">
            {msg.poll.options.map(option => (
              <li key={option._id}>
                <button 
                  onClick={() => handleVote(msg.poll._id, option._id)}
                  disabled={msg.poll.status !== 'open'}
                >
                  {option.title}
                  {option.votes > 0 && (
                    <span className="vote-count"> ({option.votes})</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div className="poll-meta">
            {msg.poll.status === 'closed' && <span className="poll-closed">[Closed]</span>}
            {msg.poll.allowMultipleChoices && <span className="poll-multiple">[Multiple choices allowed]</span>}
          </div>
        </div>
      );
    }

    return (
      <>
        <p className="message-content">{msg.message}</p>
        {msg.sender === currentUserId && (
          <div className="message-actions">
            <button onClick={() => handleEdit(msg._id, msg.message)}>
              Edit
            </button>
            <button onClick={() => handleDelete(msg._id)}>
              Delete
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="channel-chat-modal-overlay">
      <div className="channel-chat-modal">
        <div className="channel-chat-header">
          <div className="channel-header-left" onClick={toggleChannelInfo}>
            <h2>#{channel.name}</h2>
            <button className="info-button">
              ℹ️
            </button>
          </div>
          <div className="connection-status">
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </div>
          <button className="channel-chat-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {showChannelInfo && channelDetails && (
          <div className="channel-info-dialog">
            <div className="channel-info-header">
              <h3>Channel Information</h3>
              <button onClick={() => setShowChannelInfo(false)}>×</button>
            </div>
            <div className="channel-info-content">
              <p><strong>Description:</strong> {channelDetails.description || 'No description'}</p>
              <p><strong>Created by:</strong> {channelDetails.members.find(m => m._id === channelDetails.createdBy)?.name || 'Unknown'}</p>
              
              <div className="members-list">
                <h4>Members ({channelDetails.members.length}):</h4>
                <ul>
                  {channelDetails.members.map(member => (
                    <li key={member._id}>
                      {member.name} ({member.email})
                      {member._id === channelDetails.createdBy && ' (Creator)'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="channel-chat-body">
          {messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            <div className="messages-container">
              {messages.map((msg) => {
                const isMine = msg.sender === currentUserId;
                const isDeleted = msg.isDeleted;

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
                        renderMessageContent(msg)
                      )}
                      {msg.timestamp && (
                        <div className="message-time">
                          {formatTime(msg.timestamp)}
                          {msg.isEdited && !isDeleted && !msg.poll && ' (edited)'}
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
          {showPollForm ? (
            <div className="poll-creation-form">
              <input
                type="text"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                placeholder="Poll question"
              />
              {pollOptions.map((option, index) => (
                <div key={index} className="poll-option-input">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {pollOptions.length > 2 && (
                    <button 
                      onClick={() => handleRemovePollOption(index)}
                      className="remove-option-btn"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <div className="poll-form-actions">
                <button onClick={handleAddPollOption} disabled={pollOptions.length >= 10}>
                  Add Option
                </button>
                <label>
                  <input
                    type="checkbox"
                    checked={allowMultipleChoices}
                    onChange={(e) => setAllowMultipleChoices(e.target.checked)}
                  />
                  Allow multiple choices
                </label>
                <button onClick={handleCreatePoll}>Create Poll</button>
                <button onClick={() => setShowPollForm(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="message-input-container">
                <input
                  type="text"
                  value={editingId ? editText : input}
                  onChange={(e) => editingId ? setEditText(e.target.value) : setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={editingId ? "Edit your message..." : "Type a message..."}
                  disabled={!isConnected}
                />
                <button 
                  className="poll-toggle-btn"
                  onClick={() => setShowPollForm(true)}
                  disabled={editingId || !isConnected}
                >
                  Create Poll
                </button>
              </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelChatModal;