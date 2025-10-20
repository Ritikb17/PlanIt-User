import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PrivateRoute from "./PrivateRoute ";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ChannelPage from "./pages/ChannelPage";
import Discover from "./pages/DiscoverPage"; 
import DiscoverEvents from "./pages/DiscoverEvents"; 
import BlockUser from "./pages/BlockUserPage";
import EventPage from "./pages/EventPage/";
import FollowersPage from "./pages/FollowersPage";
import OtherUserProfile from "./pages/OtherUserProfile";
import GroupRequestsPage from "./pages/GroupRequestPage";
import DiscoverGroups from "./pages/DiscoverGroups";
import ReverseAuthRoutes from "./ReverseAuthRoutes";
// import GroupConnectionRequests from "./pages/GroupConnectionRequests";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };

    // Also check authentication on component mount and when token changes
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);

    window.addEventListener("storage", handleStorageChange);
    
    // Custom event listener for login/logout from other components
    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  return (
    <Router>
      {isAuthenticated && <Navbar />} {/* Only show navbar if logged in */}
      
      <Routes>
        {/* Public routes - only accessible when NOT logged in */}
        <Route element={<ReverseAuthRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes - only accessible when logged in */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/channels" element={<ChannelPage />} />
          <Route path="/followers" element={<FollowersPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/events" element={<EventPage />} />
          <Route path="/block-users" element={<BlockUser />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/profile/:username" element={<OtherUserProfile />} />
          <Route path="/group-requests" element={<GroupRequestsPage />} />
          <Route path="/discover-groups" element={<DiscoverGroups />} />
          <Route path="/discover-events" element={<DiscoverEvents />} />
          {/* <Route path="/channel-requests" element={<GroupConnectionRequests />} /> */}
          
          {/* You might want to add these event-related routes if they don't exist */}
          <Route path="/event-requests" element={<EventPage />} />
          {/* Or create a separate component for event requests */}
        </Route>

        {/* Fallback route for 404 pages */}
        <Route path="*" element={
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>404 - Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
            {isAuthenticated ? (
              <a href="/">Go to Home</a>
            ) : (
              <a href="/login">Go to Login</a>
            )}
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;