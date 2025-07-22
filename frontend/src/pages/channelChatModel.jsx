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
  const [pollsData, setPollsData] = useState({}); // Store poll data separately
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch channel details
  const fetchChannelInfo = async () => {
    try {
      console.log("Fetching channel info for:", channel._id)
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

  // Fetch poll details
  // const fetchPollDetails = async (pollId) => {
  //   try {
  //     console.log("the pool id is ", { pollId })
  //     const response = await fetch(`http://localhost:5000/api/poll/get-poll?pollId=${pollId}`, {
  //       method: 'GET',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${localStorage.getItem('token')}`
  //       }
  //     });

  //     const data = await response.json();
  //     if (data.data) {
  //       setPollsData(prev => ({
  //         ...prev,
  //         [pollId]: data.data
  //       }));
  //     }
  //   } catch (error) {
  //     console.error('Error fetching poll details:', error);
  //   }
  // };

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
          const normalizedMessages = (response.messages || []).map(msg => ({
            ...msg,
            isPool: msg.isPool || false,
            pool: msg.pool || null
          }));
          setMessages(normalizedMessages);

          // Fetch details for any polls in messages
          // normalizedMessages.forEach(msg => {
          //   if (msg.isPool && msg.pool) {
          //     // fetchPollDetails(msg.pool);
          //   }
          // });
        } else {
          console.error('Failed to get messages:', response?.message);
        }
      }
    );

    // Message event handlers
    const handleNewMessage = (data) => {
      console.log("refeshing messages");
      socket.emit('get-message-of-the-channel',
        { channelId: channel._id },
        (response) => {
          if (response?.status === 'success') {
            const normalizedMessages = (response.messages || []).map(msg => ({
              ...msg,
              isPool: msg.isPool || false,
              pool: msg.pool || null
            }));
            setMessages(normalizedMessages);

            // Fetch details for any new polls
            normalizedMessages.forEach(msg => {
              if (msg.isPool && msg.pool && !pollsData[msg.pool]) {
                // fetchPollDetails(msg.pool);
              }
            });
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
            const normalizedMessages = (response.messages || []).map(msg => ({
              ...msg,
              isPool: msg.isPool || false,
              pool: msg.pool || null
            }));
            setMessages(normalizedMessages);

            // Fetch details for the new poll
            // const newPollMessage = normalizedMessages.find(msg => msg._id === data.messageId);
            // if (newPollMessage?.isPool && newPollMessage.pool) {
            //   fetchPollDetails(newPollMessage.pool);
            // }
          } else {
            console.error('Failed to get messages:', response?.message);
          }
        }
      );
    };

    const handlePollUpdated = (data) => {
      // Update the specific poll in our pollsData state
      setPollsData(prev => ({
        ...prev,
        [data.pollId]: data.poll
      }));
    };

    socket.on('new-channel-message', handleNewMessage);
    socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('new-channel-poll', handleNewPoll);
    socket.on('poll-updated', handlePollUpdated);

    return () => {
      socket.off('new-channel-message', handleNewMessage);
      socket.off('message-edited', handleMessageEdited);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('new-channel-poll', handleNewPoll);
      socket.off('poll-updated', handlePollUpdated);
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

    socketRef.current.emit('create-pool-for-channel', pollData, (response) => {

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
    if (!socketRef.current || !currentUserId) {
      console.error("Socket not connected or user not authenticated");
      return;
    }

    console.log("Attempting to vote on poll:", pollId, "option:", optionId);

    socketRef.current.emit('vote-on-pool-for-channel', {
      pollId,
      optionId,
      channelId: channel._id,
      userId: currentUserId
    }, (response) => {
      console.log("Response from socket:", response);

      if (!response) {
        console.error("No response received from server");
        return;
      }

      if (response.status !== 'success') {
        console.error('Failed to vote:', response.message || 'Unknown error');
        // Optionally show error to user here (e.g., using a toast notification)
      } else {
        console.log('Vote successful:', response.data);
        // Optionally update UI state here if needed
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

    if (msg.isPool && msg.pool && pollsData[msg.pool]) {
      const poll = pollsData[msg.pool];
      const hasVoted = poll.options.some(option =>
        option.voters?.includes(currentUserId)
      );
    }
  }
  return (
    <div className="channel-chat-modal-overlay">
      <div className="channel-chat-modal">
        {/* Header Section */}
        <div className="channel-chat-header">
          <div className="channel-header-left" onClick={toggleChannelInfo}>
            <h2>#{channel.name}</h2>
            <button className="info-button">ℹ️</button>
          </div>
          <div className="connection-status">
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </div>
          <button className="channel-chat-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Channel Info Panel */}
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

        {/* Chat Messages Body */}
        <div className="channel-chat-body">
          {messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            <div className="messages-container">
              {messages.map((msg) => {
                const isMine = msg.sender === currentUserId;
                const isDeleted = msg.isDeleted;
                const isPoll = msg.isPool && msg.pool;

                return (
                  <div key={msg._id} className={`message-wrapper ${isMine ? 'own' : 'other'}`}>
                    <div className={`message-bubble ${isMine ? 'own' : 'other'} ${isDeleted ? 'deleted' : ''} ${isPoll ? 'poll-message' : ''}`}>
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
                          {msg.message && <p className="message-content">{msg.message}</p>}
                          {isPoll && (
                            <div className="poll-message">
                              <h4>{msg.pool.title}</h4>
                              <ul className="poll-options">
                                {msg.pool.options.map(option => {
                                  const hasVoted = option.voters?.includes(currentUserId);
                                  return (
                                    <li key={option._id}>
                                      <button
                                        onClick={() => handleVote(msg.pool._id, option._id)}
                                        disabled={msg.pool.status !== 'open' || (hasVoted && !msg.pool.allowMultipleChoices)}
                                        className={`poll-option-button ${hasVoted ? 'voted' : ''} ${msg.pool.status !== 'open' ? 'disabled' : ''
                                          }`}
                                      >
                                        {option.title}
                                        {option.votes > 0 && (
                                          <span className="vote-count"> ({option.votes})</span>
                                        )}
                                        {hasVoted && <span className="voted-icon">✓</span>}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                              <div className="poll-meta">
                                {msg.pool.status === 'closed' && <span className="poll-closed">[Closed]</span>}
                                {msg.pool.allowMultipleChoices && <span className="poll-multiple">[Multiple choices allowed]</span>}
                              </div>
                            </div>
                          )}
                          {isMine && !isDeleted && !isPoll && (
                            <div className="message-actions">
                              <button onClick={() => handleEdit(msg._id, msg.message)}>Edit</button>
                              <button onClick={() => handleDelete(msg._id)}>Delete</button>
                            </div>
                          )}
                        </>
                      )}
                      <div className="message-meta">
                        {msg.timestamp && (
                          <span className="message-time">
                            {formatTime(msg.timestamp)}
                            {msg.isEdited && !isDeleted && !isPoll && ' (edited)'}
                            {msg.failed && ' (failed)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input Area */}
        <div className="channel-chat-footer">
          {showPollForm ? (
            <div className="poll-creation-form">
              <input
                type="text"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                placeholder="Poll question"
                className="poll-title-input"
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
                <button
                  onClick={handleAddPollOption}
                  disabled={pollOptions.length >= 10}
                  className="add-option-btn"
                >
                  Add Option
                </button>
                <label className="multiple-choices-toggle">
                  <input
                    type="checkbox"
                    checked={allowMultipleChoices}
                    onChange={(e) => setAllowMultipleChoices(e.target.checked)}
                  />
                  Allow multiple choices
                </label>
                <div className="poll-submit-buttons">
                  <button onClick={handleCreatePoll} className="create-poll-btn">
                    Create Poll
                  </button>
                  <button onClick={() => setShowPollForm(false)} className="cancel-poll-btn">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="message-input-area">
              <div className="input-container">
                <input
                  type="text"
                  value={editingId ? editText : input}
                  onChange={(e) => editingId ? setEditText(e.target.value) : setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={editingId ? "Edit your message..." : "Type a message..."}
                  disabled={!isConnected}
                  className="message-input"
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
                <div className="edit-buttons">
                  <button onClick={handleEditSubmit} disabled={!editText.trim()}>
                    Save
                  </button>
                  <button onClick={() => { setEditingId(null); setEditText(''); }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !isConnected}
                  className="send-button"
                >
                  Send
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





export default ChannelChatModal;