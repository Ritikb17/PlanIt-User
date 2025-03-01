import React from 'react';
import './Post.css';

const Post = ({ username, content, likes, comments }) => {
  return (
    <div className="post">
      <div className="post-header">
        <h3>{username}</h3>
      </div>
      <p className="post-content">{content}</p>
      <div className="post-actions">
        <button className="post-button">❤️ {likes}</button>
        <button className="post-button">💬 {comments}</button>
      </div>
    </div>
  );
};

export default Post;