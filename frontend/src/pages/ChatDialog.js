import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatDialog.css';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token'),
  },
  transports: ['websocket'],
});

const ChatDialog = ({ chat, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [chatId, setChatId] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!chat?._id) return;

    socket.emit('get-messages', chat._id, (response) => {
      if (response.status === 'success') {
        setMessages(response.messages);
        setChatId(response.chat_id)
        console.log("RESPONSE IS",response)
      }
    });

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleMessageDeleted = (deletedId) => {
      socket.emit('get-messages', chat._id, (response) => {
        if (response.status === 'success') {
          setMessages(response.messages);
          setChatId(response.chat_id)
          console.log("RESPONSE IS",response)
        }
      });
    };

    const handleMessageEdited = () => {
      socket.emit('get-messages', chat._id, (response) => {
        if (response.status === 'success') {
          setMessages(response.messages);
          setChatId(response.chat_id)
          console.log("RESPONSE IS",response)
        }
      });
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('edit-message', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('message-edited', handleMessageEdited);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('message-edited', handleMessageEdited);
    };
  }, [chat._id]);

  const handleSend = () => {
    if (input.trim()) {
      const newMessage = {
        _id: Date.now().toString(), 
        sender: myId,
        message: input,
        timestamp: new Date().toISOString(),
      };
  
      // Optimistically update UI
      setMessages((prev) => [...prev, newMessage]);
      setInput('');
  
      // Send to server
      socket.emit('send-message', { 
        receiverId: chat._id, 
        message: input  
      },
       (response) => {
        if (response.status === 'success') {
          // Replace temp message with server-generated one
          setMessages((prev) =>
            prev.map((msg) => 
              msg._id === newMessage._id ? response.message : msg
            )
          );
        } else {
          // Rollback if failed
          setMessages((prev) => prev.filter((msg) => msg._id !== newMessage._id));
        }
      });
    }
  };

  const handleEdit = (id, currentText) => {
    setEditingId(id);
    setEditText(currentText);
    
  };

  const handleEditSubmit = (id) => {

    if (editText.trim()) {

      socket.emit('edit-message', { messageId: id, newMessage: editText,receiverId: chat._id ,chatId:chatId}, (res) => {
        if (res.status === 'success') {
          setEditingId(null);
          setEditText('');
        }
      });
      socket.emit('get-messages', chat._id, (response) => {
        if (response.status === 'success') {
          setMessages(response.messages);
          setChatId(response.chat_id)
          console.log("RESPONSE IS",response)
        }
      });
    }
  };

  const handleDelete = (id) => {
    socket.emit('delete-message', { messageId: id ,receiverId: chat._id,chatId:chatId}, (response) => {
      if (response.status != 'success') {
        console.log("fail to delete message ")
      }
    });
    socket.emit('get-messages', chat._id, (response) => {
      if (response.status === 'success') {
        setMessages(response.messages);
        setChatId(response.chat_id)
        console.log("RESPONSE IS",response)
      }
    });


  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const myId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;

  return (
    <div className="chat-dialog-overlay">
      <div className="chat-dialog">
        <div className="chat-dialog-header">
          <img src={chat.profilePicture} alt={chat.username} className="profile-picture" />
          <h3>{chat.username}</h3>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
  
        <div className="chat-dialog-body">
          {messages.map((msg, idx) => {
            const isMine = msg.sender === myId;
  
            return (
              <div key={msg._id || idx} className={`message-wrapper ${isMine ? 'own' : 'other'}`}>
                <div className={`message-bubble ${isMine ? 'own' : 'other'}`}>
                  {editingId === msg._id ? (
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit(msg._id)}
                      className="edit-input"
                    />
                  ) : (
                    <>
                      {msg.isDeleted ? (
                        <p className="deleted-message">[This message has been deleted]</p>
                      ) : (
                        <>
                          <p>{msg.message}</p>
                          {isMine && (
                            <div className="actions">
                              <button onClick={() => handleEdit(msg._id, msg.message)}>Edit</button>
                              <button onClick={() => handleDelete(msg._id)}>Delete</button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
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
