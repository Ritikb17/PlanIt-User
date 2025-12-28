import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatDialog.css';
import recSound from '../assets/sounds/notification/recMessage.mp3';
import sendSound from '../assets/sounds/notification/sendMessage.mp3';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token'),
  },
  transports: ['websocket'],
});

const ChatDialog = ({ chat, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [chatId, setChatId] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBlobs, setImageBlobs] = useState({});

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const myId = JSON.parse(
    atob(localStorage.getItem('token').split('.')[1])
  ).id;

  /* ------------------ Clean up blob URLs on unmount ------------------ */
  useEffect(() => {
    return () => {
      Object.values(imageBlobs).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  /* ------------------ Sounds ------------------ */
  const playSendSound = () => {
    const audio = new Audio(sendSound);
    audio.play().catch(() => {});
  };

  const playRecSound = () => {
    const audio = new Audio(recSound);
    audio.play().catch(() => {});
  };

  /* ------------------ Scroll ------------------ */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ------------------ Fetch Messages and Images ------------------ */
  useEffect(() => {
    if (!chat?._id) return;

    socket.emit('get-messages', chat._id, (res) => {
      if (res.status === 'success') {
        console.log('Fetched messages:', res.messages);
        setMessages(res.messages);
        setChatId(res.chat_id);
        
        // Pre-fetch images for image messages
        res.messages.forEach(msg => {
          if (msg.file && isImageFile(msg.file) && msg.fileURL) {
            fetchAndCacheImage(msg.fileURL, msg._id);
          }
        });
      }
    });

    const receiveHandler = (msg) => {
      setMessages((prev) => [...prev, msg]);
      playRecSound();
      
      // Fetch image for new message if it's an image
      if (msg.file && isImageFile(msg.file) && msg.fileURL) {
        fetchAndCacheImage(msg.fileURL, msg._id);
      }
    };

    socket.on('receive-message', receiveHandler);

    return () => {
      socket.off('receive-message', receiveHandler);
    };
  }, [chat?._id]);

  /* ------------------ Fetch and Cache Image with Auth ------------------ */
  const fetchAndCacheImage = async (imageUrl, messageId) => {
    if (!imageUrl || imageBlobs[messageId]) return;

    try {
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
    
    // Add token as query parameter for download links
    const separator = fileURL.includes('?') ? '&' : '?';
    return `${fileURL}${separator}token=${encodeURIComponent(token)}`;
  };

  /* ------------------ File Preview ------------------ */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* ------------------ SEND MESSAGE WITH FILE ------------------ */
  const sendMessageWithFile = async () => {
    if (!input.trim() && !selectedFile) return;

    playSendSound();

    const formData = new FormData();
    if (input.trim()) {
      formData.append('message', input);
    }
    formData.append('reciverId', chat._id);
    formData.append('file', selectedFile);
    console.log("chat is ",chat )

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

      if (data.status === 'success') {
        setMessages((prev) => [...prev, data.message]);
        
        // Fetch and cache the image if it's an image file
        if (data.message.file && isImageFile(data.message.file) && data.message.fileURL) {
          fetchAndCacheImage(data.message.fileURL, data.message._id);
        }
        
        setInput('');
        clearFileSelection();
      }
    } catch (err) {
      console.error('File message error:', err);
    }
  };

  /* ------------------ SEND TEXT MESSAGE ------------------ */
  const handleSend = () => {
    // FILE MESSAGE
    if (selectedFile) {
      sendMessageWithFile();
      return;
    }

    if (!input.trim()) return;

    playSendSound();

    const tempMsg = {
      _id: Date.now().toString(),
      sender: myId,
      message: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInput('');

    socket.emit(
      'send-message',
      { receiverId: chat._id, message: input },
      (res) => {
        if (res.status === 'success') {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempMsg._id ? res.message : m))
          );
        } else {
          setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
        }
      }
    );
  };

  /* ------------------ CHECK IF FILE IS IMAGE ------------------ */
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerFileName = fileName.toLowerCase();
    return imageExtensions.some(ext => lowerFileName.includes(ext));
  };

  /* ------------------ DOWNLOAD FILE WITH AUTH HEADER ------------------ */
  const downloadFileWithAuth = async (fileURL, fileName) => {
    try {
      
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
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  /* ------------------ EDIT ------------------ */
  const handleEditSubmit = (id) => {
    if (!editText.trim()) return;

    socket.emit(
      'edit-message',
      { messageId: id, newMessage: editText, receiverId: chat._id, chatId },
      () => {
        setEditingId(null);
        setEditText('');
      }
    );
  };

  /* ------------------ DELETE ------------------ */
  const handleDelete = (id) => {
    socket.emit('delete-message', {
      messageId: id,
      receiverId: chat._id,
      chatId,
    });
  };

  return (
    <div className="chat-dialog-overlay">
      <div className="chat-dialog">
        {/* HEADER */}
        <div className="chat-dialog-header">
          <img src={chat.profilePicture} alt={chat.username} />
          <h3>{chat.username}</h3>
          <button onClick={onClose}>✖</button>
        </div>

        {/* BODY */}
        <div className="chat-dialog-body">
          {messages.map((msg) => {
            const isMine = msg.sender === myId;
            const hasImage = msg.file && isImageFile(msg.file);
            const imageBlobUrl = hasImage ? imageBlobs[msg._id] : null;

            return (
              <div
                key={msg._id}
                className={`message-wrapper ${isMine ? 'own' : 'other'}`}
              >
                <div className="message-bubble">
                  {editingId === msg._id ? (
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleEditSubmit(msg._id)
                      }
                      autoFocus
                    />
                  ) : (
                    <>
                      {/* TEXT MESSAGE */}
                      {msg.message && <p>{msg.message}</p>}
                      
                      {/* IMAGE DISPLAY */}
                      {hasImage && (
                        <div className="message-image-container">
                          {imageBlobUrl ? (
                            <>
                              <img 
                                src={imageBlobUrl} 
                                alt="Shared image" 
                                className="message-image"
                                onClick={() => window.open(msg.fileURL, '_blank')}
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
                      {isMine && (
                        <div className="actions">
                          <button
                            onClick={() => {
                              setEditingId(msg._id);
                              setEditText(msg.message || '');
                            }}
                            disabled={!msg.message} // Disable edit if no text message
                          >
                            Edit
                          </button>
                          <button onClick={() => handleDelete(msg._id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  <span className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {msg.isEdited && <span className="edited-label"> (edited)</span>}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="message-input"
          />

          <button onClick={handleSend} className="send-button">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;