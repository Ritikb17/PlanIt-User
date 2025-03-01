import React from 'react';
import Post from './Post';
import './Feed.css';

const Feed = () => {
  const posts = [
    { username: 'user1', content: 'This is my first post!', likes: 10, comments: 2 },
    { username: 'user2', content: 'Hello world!', likes: 5, comments: 1 },
  ];

  return (
    <div className="feed">
      {posts.map((post, index) => (
        <Post key={index} {...post} />
      ))}
    </div>
  );
};

export default Feed;