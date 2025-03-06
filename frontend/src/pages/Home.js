import React, { useState } from 'react';
import './Home.css'; // Import the CSS file

const Home = () => {
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);

  // Dummy feed data with multiple posts
  const feed = [
    {
      id: 1,
      username: 'JohnDoe',
      content: 'This is a sample post!',
      likes: 10,
      shares: 5,
    },
    {
      id: 2,
      username: 'JaneDoe',
      content: 'Another post here!',
      likes: 15,
      shares: 3,
    },
    {
      id: 3,
      username: 'AliceSmith',
      content: 'Hello everyone!',
      likes: 8,
      shares: 2,
    },
    {
      id: 4,
      username: 'BobJohnson',
      content: 'Just sharing my thoughts.',
      likes: 12,
      shares: 4,
    },
    {
      id: 5,
      username: 'CharlieBrown',
      content: 'Enjoying the weekend!',
      likes: 20,
      shares: 6,
    },
    {
      id: 6,
      username: 'DianaPrince',
      content: 'New project coming soon!',
      likes: 18,
      shares: 7,
    },
    {
      id: 7,
      username: 'EveAdams',
      content: 'Learning React is fun!',
      likes: 25,
      shares: 10,
    },
    {
      id: 8,
      username: 'FrankMiller',
      content: 'Check out my new blog post.',
      likes: 14,
      shares: 3,
    },
    {
      id: 9,
      username: 'GraceHopper',
      content: 'Coding all day!',
      likes: 30,
      shares: 12,
    },
    {
      id: 10,
      username: 'HarryPotter',
      content: 'Magic is real!',
      likes: 22,
      shares: 8,
    },
  ];

  return (
    <div className="homepage">
      {/* Chat Section */}
      <div className="chat-section">
        <h3>Chats</h3>
        <div className="chat-list">
          <div className="chat-item">
            <p>John Doe</p>
          </div>
          <div className="chat-item">
            <p>Jane Doe</p>
          </div>
          <div className="chat-item">
            <p>Jane Doe</p>
          </div>
          <div className="chat-item">
            <p>Jane Doe</p>
          </div>
          <div className="chat-item">
            <p>Jane Doe</p>
          </div>
          <div className="chat-item">
            <p>Jane Doe</p>
          </div>
          <div className="chat-item">
            <p>Jane Doe</p>
          </div>
          <div className="chat-item">
            <p>Jane Doe</p>
          </div>
          <div className="chat-item">
            <p>Jane Doe</p>
          </div>
          <div className="chat-item">
            <p>Jane Doe</p>
          </div>
          <div className="chat-item">
            <p>Jane Doe</p>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="feed">
        {feed.map((post) => (
          <div key={post.id} className="post">
            <div className="post-header">
              <h3>{post.username}</h3>
            </div>
            <div className="post-content">
              <p>{post.content}</p>
            </div>
            <div className="post-actions">
              <button className="like-btn">
                <i className="fas fa-thumbs-up"></i> {post.likes}
              </button>
              <button className="share-btn">
                <i className="fas fa-share"></i> {post.shares}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Events Button */}
      <div className="events-button" onClick={() => setIsEventsModalOpen(true)}>
        <i className="fas fa-calendar-alt"></i>
      </div>

      {/* Events Modal */}
      {isEventsModalOpen && (
        <div className="events-modal">
          <div className="modal-content">
            <h2>Events</h2>
            <p>Here are your upcoming events!</p>
            <button onClick={() => setIsEventsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;