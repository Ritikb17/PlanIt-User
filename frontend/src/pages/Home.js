import React from 'react';
import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <div>
      <Navbar />
      <h2>Home</h2>
      <div className="feed">
        {/* Feed content goes here */}
        <p>Welcome to the feed!</p>
      </div>
    </div>
  );
};

export default Home;