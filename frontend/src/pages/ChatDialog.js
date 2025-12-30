import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import './ChatDialog.css';
import recSound from '../assets/sounds/notification/recMessage.mp3';
import sendSound from '../assets/sounds/notification/sendMessage.mp3';

const ChatDialog = ({ chat, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [chatId, setChatId] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBlobs, setImageBlobs] = useState({});
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  const myId = JSON.parse(
    atob(localStorage.getItem('token').split('.')[1])
  ).id;

  /* ------------------ Initialize Socket Connection ------------------ */
  useEffect(() => {
    console.log('Initializing socket connection...');
    
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token'),
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected with ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
      setIsConnected(false);
    });

    // Debug: Log all incoming events
    newSocket.onAny((eventName, ...args) => {
      console.log(`🔔 Socket event [${eventName}]:`, args);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection...');
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.offAny();
      newSocket.disconnect();
    };
  }, []);

  /* ------------------ Clean up blob URLs on unmount ------------------ */
  useEffect(() => {
    return () => {
      Object.values(imageBlobs).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageBlobs]);

  /* ------------------ Sounds ------------------ */
  const playSendSound = useCallback(() => {
    const audio = new Audio(sendSound);
    audio.play().catch(() => {});
  }, []);

  const playRecSound = useCallback(() => {
    const audio = new Audio(recSound);
    audio.play().catch(() => {});
  }, []);

  /* ------------------ Scroll to bottom ------------------ */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ------------------ Setup Message Listeners and Fetch Messages ------------------ */
  useEffect(() => {
    if (!socket || !chat?._id) {
      console.log('Socket or chat not ready:', { socket, chatId: chat?._id });
      return;
    }

    console.log(`📡 Setting up listeners for chat: ${chat._id}`);

    const receiveHandler = (msg) => {
      console.log('📨 RECEIVE-MESSAGE event triggered:', msg);
      console.log('Current chat ID:', chat._id, 'Message chat ID:', msg.chatId || msg.receiver);
      
      // Check if message belongs to current chat
      const isForThisChat = msg.chatId === chat._id || 
                           msg.receiver === chat._id || 
                           msg.sender === chat._id;
      
      if (isForThisChat) {
        console.log('✅ Message belongs to current chat');
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(m => m._id === msg._id)) {
            console.log('Message already exists, skipping');
            return prev;
          }
          return [...prev, msg];
        });
        playRecSound();
        
        // Fetch image if it's an image message
        if (msg.file && isImageFile(msg.file) && msg.fileURL) {
          fetchAndCacheImage(msg.fileURL, msg._id);
        }
      } else {
        console.log('⚠️ Message not for current chat, ignoring');
      }
    };

    const messageEditedHandler = (updatedMsg) => {
      console.log('✏️ Message edited:', updatedMsg);
      setMessages(prev =>
        prev.map(msg =>
          msg._id === updatedMsg._id ? { ...msg, ...updatedMsg, isEdited: true } : msg
        )
      );
      setEditingId(null);
      setEditText('');
    };

    const messageDeletedHandler = ({ messageId }) => {
      console.log('🗑️ Message deleted:', messageId);
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, isDeleted: true, message: '[Message deleted]' } : msg
        )
      );
    };

    // Remove any existing listeners first
    socket.off('receive-message', receiveHandler);
    socket.off('message-edited', messageEditedHandler);
    socket.off('message-deleted', messageDeletedHandler);

    // Setup new listeners
    socket.on('receive-message', receiveHandler);
    socket.on('message-edited', messageEditedHandler);
    socket.on('message-deleted', messageDeletedHandler);

    // Fetch initial messages
    console.log('Fetching initial messages for chat:', chat._id);
    socket.emit('get-messages', chat._id, (res) => {
      console.log('📜 Initial messages response:', res);
      if (res?.status === 'success') {
        setMessages(res.messages || []);
        setChatId(res.chat_id || chat._id);
        
        // Pre-fetch images for image messages
        (res.messages || []).forEach(msg => {
          if (msg.file && isImageFile(msg.file) && msg.fileURL) {
            fetchAndCacheImage(msg.fileURL, msg._id);
          }
        });
      } else {
        console.error('Failed to fetch messages:', res?.message);
      }
    });

    // Cleanup function
    return () => {
      console.log(`🧹 Cleaning up listeners for chat: ${chat._id}`);
      socket.off('receive-message', receiveHandler);
      socket.off('message-edited', messageEditedHandler);
      socket.off('message-deleted', messageDeletedHandler);
    };
  }, [socket, chat?._id, playRecSound]);

  /* ------------------ Fetch and Cache Image with Auth ------------------ */
  const fetchAndCacheImage = async (imageUrl, messageId) => {
    if (!imageUrl || imageBlobs[messageId]) return;

    try {
      console.log('Fetching image for message:', messageId);
      const token = localStorage.getItem('token');
      const response = await fetch(imageUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setImageBlobs(prev => ({ ...prev, [messageId]: blobUrl }));
        console.log('Image cached successfully');
      } else {
        console.error('Failed to fetch image, status:', response.status);
      }
    } catch (err) {
      console.error('Error fetching image:', err);
    }
  };

  /* ------------------ GET FILE URL WITH TOKEN FOR DOWNLOADS ------------------ */
  const getFileUrlWithToken = (fileURL) => {
    if (!fileURL) return '';
    
    const token = localStorage.getItem('token');
    if (!token) return fileURL;
    
    const separator = fileURL.includes('?') ? '&' : '?';
    return `${fileURL}${separator}token=${encodeURIComponent(token)}`;
  };

  /* ------------------ File Preview ------------------ */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type);

    // Check if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }

    setSelectedFile(file);
  };

  /* ------------------ Clear File Selection ------------------ */
  const clearFileSelection = () => {
    console.log('Clearing file selection');
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* ------------------ SEND MESSAGE WITH FILE ------------------ */
  const sendMessageWithFile = async () => {
    if ((!input.trim() && !selectedFile) || !socket) {
      console.log('Cannot send: missing input/file or socket');
      return;
    }

    console.log('Sending message with file:', selectedFile?.name);
    playSendSound();

    const formData = new FormData();
    if (input.trim()) {
      formData.append('message', input);
    }
    formData.append('receiverId', chat._id);
    formData.append('chatId', chat._id);
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    console.log("Sending to chat:", chat);

    try {
        
       const res = await fetch(
        `http://localhost:5000/api/messages/send-chat-message-with-file/${chat.chatId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      );

      const data = await res.json();
      // console.log('File message response:', data);

      if (data.status === 'success') {
        // Optimistically add message to UI
        
        setMessages(prev => [...prev, data.message]);
        
        
        // Fetch and cache the image if it's an image file
        if (data.message.file && isImageFile(data.message.file) && data.message.fileURL) {
          fetchAndCacheImage(data.message.fileURL, data.message._id);
        }
        
        setInput('');
        clearFileSelection();
      } else {
        console.error('Failed to send file message:', data.message);
        alert('Failed to send file: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('File message error:', err);
      alert('Error sending file: ' + err.message);
    }
  };

  /* ------------------ SEND TEXT MESSAGE ------------------ */
  const handleSend = () => {
    // FILE MESSAGE
    if (selectedFile) {
      sendMessageWithFile();
      return;
    }

    if (!input.trim() || !socket) {
      console.log('Cannot send: empty input or no socket');
      return;
    }

    console.log('Sending text message:', input);
    playSendSound();

    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      _id: tempId,
      sender: myId,
      receiver: chat._id,
      message: input,
      timestamp: new Date().toISOString(),
      isTemp: true
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMsg]);
    setInput('');

    socket.emit(
      'send-message',
      { receiverId: chat._id, message: input },
      (res) => {
        console.log('Send message callback response:', res);
        if (res?.status === 'success') {
          // Replace temp message with real message
          setMessages(prev =>
            prev.map(m => m._id === tempId ? res.message : m)
          );
          console.log('Message sent successfully');
        } else {
          console.error('Failed to send message:', res?.message);
          // Mark temp message as failed
          setMessages(prev =>
            prev.map(m => m._id === tempId ? { ...m, failed: true } : m)
          );
        }
      }
    );
  };

  /* ------------------ CHECK IF FILE IS IMAGE ------------------ */
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerFileName = fileName.toLowerCase();
    return imageExtensions.some(ext => lowerFileName.endsWith(ext));
  };

  /* ------------------ DOWNLOAD FILE WITH AUTH HEADER ------------------ */
  const downloadFileWithAuth = async (fileURL, fileName) => {
    try {
      console.log('Downloading file:', fileName);
      const token = localStorage.getItem('token');
      const response = await fetch(fileURL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('File downloaded successfully');
      } else {
        console.error('Download failed, status:', response.status);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  /* ------------------ EDIT MESSAGE ------------------ */
  const handleEditSubmit = (id) => {
    if (!editText.trim() || !socket) {
      console.log('Cannot edit: empty text or no socket');
      return;
    }

    console.log('Editing message:', id, 'New text:', editText);

    socket.emit(
      'edit-message',
      { 
        messageId: id, 
        newMessage: editText, 
        receiverId: chat._id, 
        chatId: chatId || chat._id 
      },
      (response) => {
        console.log('Edit response:', response);
        if (response?.status === 'success') {
          setEditingId(null);
          setEditText('');
          console.log('Message edited successfully');
        } else {
          console.error('Edit failed:', response?.message);
        }
      }
    );
  };

  /* ------------------ DELETE MESSAGE ------------------ */
  const handleDelete = (id) => {
    if (!socket || !window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    console.log('Deleting message:', id);

    socket.emit('delete-message', {
      messageId: id,
      receiverId: chat._id,
      chatId: chatId || chat._id,
    }, (response) => {
      console.log('Delete response:', response);
      if (response?.status === 'success') {
        console.log('Message deleted successfully');
      } else {
        console.error('Delete failed:', response?.message);
      }
    });
  };

  /* ------------------ Key Down Handler ------------------ */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingId) {
        handleEditSubmit(editingId);
      } else {
        handleSend();
      }
    }
  };

  /* ------------------ RENDER MESSAGE CONTENT ------------------ */
  const renderMessageContent = (msg) => {
    const isMine = msg.sender === myId;
    const isDeleted = msg.isDeleted;
    const hasImage = msg.file && isImageFile(msg.file);
    const imageBlobUrl = hasImage ? imageBlobs[msg._id] : null;

    if (editingId === msg._id) {
      return (
        <div className="edit-message-container">
          <input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="edit-input"
            autoFocus
          />
          <div className="edit-buttons">
            <button onClick={() => handleEditSubmit(msg._id)} disabled={!editText.trim()}>
              Save
            </button>
            <button onClick={() => { setEditingId(null); setEditText(''); }}>
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {isDeleted ? (
          <p className="deleted-message-text">
            {isMine ? '[You deleted this message]' : '[Message deleted]'}
          </p>
        ) : (
          <>
            {/* TEXT MESSAGE */}
            {msg.message && <p className="message-content">{msg.message}</p>}
            
            {/* IMAGE DISPLAY */}
            {hasImage && (
              <div className="message-image-container">
                {imageBlobUrl ? (
                  <>
                    <img 
                      src={imageBlobUrl} 
                      alt="Shared image" 
                      className="message-image"
                      onClick={() => window.open(getFileUrlWithToken(msg.fileURL), '_blank')}
                    />
                    <button 
                      onClick={() => downloadFileWithAuth(msg.fileURL, msg.file)}
                      className="image-download-link"
                    >
                      Download
                    </button>
                  </>
                ) : (
                  <div className="image-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading image...</span>
                  </div>
                )}
              </div>
            )}
            
            {/* NON-IMAGE FILE DISPLAY */}
            {msg.file && !hasImage && (
              <div className="file-container">
                <button 
                  onClick={() => downloadFileWithAuth(msg.fileURL, msg.file)}
                  className="file-link"
                >
                  📎 {msg.file}
                </button>
              </div>
            )}

            {/* ACTIONS FOR OWN MESSAGES */}
            {isMine && !msg.isTemp && !isDeleted && (
              <div className="message-actions">
                <button onClick={() => { setEditingId(msg._id); setEditText(msg.message || ''); }}>
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
    );
  };

  return (
    <div className="chat-dialog-overlay">
      <div className="chat-dialog">
        {/* HEADER */}
        <div className="chat-dialog-header">
          <div className="header-left">
            <img src={chat.profilePicture} alt={chat.username} className="chat-profile-pic" />
            <div>
              <h3>{chat.username}</h3>
              <div className="connection-status">
                {isConnected ? '🟢 Online' : '🔴 Offline'}
              </div>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            ✖
          </button>
        </div>

        {/* BODY */}
        <div className="chat-dialog-body">
          {messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            <div className="messages-container">
              {messages.map((msg) => {
                const isMine = msg.sender === myId;
                
                // Don't show deleted messages from others
                if (msg.isDeleted && !isMine) return null;

                return (
                  <div 
                    key={msg._id} 
                    className={`message-wrapper ${isMine ? 'own' : 'other'}`}
                  >
                    <div className={`message-bubble ${isMine ? 'own' : 'other'} ${msg.isDeleted ? 'deleted' : ''}`}>
                      {renderMessageContent(msg)}
                      <div className="message-meta">
                        {msg.timestamp && (
                          <span className="timestamp">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                        {msg.isEdited && !msg.isDeleted && <span className="edited-label"> (edited)</span>}
                        {msg.failed && <span className="failed-label"> (failed)</span>}
                        {msg.isTemp && <span className="temp-label"> (sending...)</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="chat-dialog-footer">
          {/* FILE INPUT WITH PREVIEW */}
          <div className="file-input-section">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*, .pdf, .doc, .docx, .txt"
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="file-button"
              disabled={!isConnected}
            >
              📎 Attach
            </button>
            
            {/* FILE PREVIEW */}
            {selectedFile && (
              <div className="file-preview">
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button onClick={clearFileSelection} className="remove-file">
                      ✖
                    </button>
                  </div>
                ) : (
                  <div className="file-info">
                    <span>{selectedFile.name}</span>
                    <button onClick={clearFileSelection} className="remove-file">
                      ✖
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <input
            type="text"
            value={editingId ? editText : input}
            onChange={(e) => editingId ? setEditText(e.target.value) : setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingId ? "Edit your message..." : (isConnected ? "Type a message..." : "Connecting...")}
            disabled={!isConnected}
            className="message-input"
          />

          {editingId ? (
            <div className="edit-controls">
              <button 
                onClick={() => handleEditSubmit(editingId)} 
                disabled={!editText.trim() || !isConnected}
                className="save-edit-button"
              >
                Save
              </button>
              <button 
                onClick={() => { setEditingId(null); setEditText(''); }}
                className="cancel-edit-button"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSend} 
              disabled={(!input.trim() && !selectedFile) || !isConnected}
              className="send-button"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;