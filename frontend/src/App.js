import React from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import PrivateRoute from "./PrivateRoute ";
import Profile from './pages/Profile';
import Register from './pages/Register';
import GroupPage from './pages/GroupPage';
import EventPage from './pages/EventPage';
import FollowersPage from './pages/FollowersPage';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
    
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* this wrap the routes in Privte route */}
        <Route element={<PrivateRoute />}>    
          <Route path="/" element={<Home />} />
        


        <Route path="/groups" element={<GroupPage />} />
        <Route path="/followers" element={<FollowersPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/events" element={<EventPage />} />
        </Route>

       
      </Routes>
    </Router>
  );
}

export default App;