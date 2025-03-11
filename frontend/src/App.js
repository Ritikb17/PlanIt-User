import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PrivateRoute from "./PrivateRoute ";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import GroupPage from "./pages/GroupPage";
import EventPage from "./pages/EventPage";
import FollowersPage from "./pages/FollowersPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Router>
      {isAuthenticated && <Navbar />} {/* Only show navbar if logged in */}
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Wrap protected routes inside PrivateRoute */}
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
