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

  const messagesEndRef = useRef(null);

  const myId = JSON.parse(
    atob(localStorage.getItem('token').split('.')[1])
  ).id;

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

  /* ------------------ Fetch Messages ------------------ */
  useEffect(() => {
    if (!chat?._id) return;

    socket.emit('get-messages', chat._id, (res) => {
      if (res.status === 'success') {
        console.log('Fetched messages:', res.messages);
        setMessages(res.messages);
        setChatId(res.chat_id);
      }
    });

    const receiveHandler = (msg) => {
      setMessages((prev) => [...prev, msg]);
      playRecSound();
    };

    socket.on('receive-message', receiveHandler);

    return () => {
      socket.off('receive-message', receiveHandler);
    };
  }, [chat?._id]);

  /* ------------------ SEND MESSAGE WITH FILE ------------------ */
  const sendMessageWithFile = async () => {
    if (!input.trim() && !selectedFile) return;

    playSendSound();

    const formData = new FormData();
    formData.append('message', input);
    formData.append('reciverId', chat._id);
    formData.append('file', selectedFile);

    try {
      const res = await fetch(
        `http://localhost:5000/api/messages/send-chat-message-with-file/${chat._id}`,
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
        setInput('');
        setSelectedFile(null);
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
          <img src={chat.profilePicture} alt="" />
          <h3>{chat.username}</h3>
          <button onClick={onClose}>✖</button>
        </div>

        {/* BODY */}
        <div className="chat-dialog-body">
          {messages.map((msg) => {
            const isMine = msg.sender === myId;

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
                    />
                  ) : (
                    <>
                      <p>{msg.message}</p>

                      {/* FILE */}
                      {msg.fileUrl && (
                        <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                          📎 View File
                        </a>
                      )}

                      {isMine && (
                        <div className="actions">
                          <button
                            onClick={() => {
                              setEditingId(msg._id);
                              setEditText(msg.message);
                            }}
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
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* FOOTER */}
        <div className="chat-dialog-footer">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />

          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;
