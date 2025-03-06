import React from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';

import Profile from './pages/Profile';
import Register from './pages/Register';
import GroupPage from './pages/GroupPage';
import FollowersPage from './pages/FollowersPage';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/groups" element={<GroupPage />} />
        <Route path="/followers" element={<FollowersPage />} />
        <Route path="/profile" element={<Profile />} />
      
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;