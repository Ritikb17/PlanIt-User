import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './auth.css'; // Import the shared CSS file

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleLogin = async (event) => {
    event.preventDefault(); // Prevent default form submission
  
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Login failed. Please check your credentials.");
      }
  
      // Store token securely
      localStorage.setItem("token", data.token);
  
      // Redirect after login
      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message); // Set error message in UI
    }
  };
  
  

  return (
    <div className="auth-page">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Welcome to SocialApp</h1>
        <p className="tagline">Connect with friends and share your moments</p>
      </div>

      {/* Login Form */}
      <div className="auth-form">
        <h2>Login</h2>
        <form onSubmit={handleLogin}> {/* Attach handleLogin to form's onSubmit */}
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
            />
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
            />
          </div>

          {/* Error Message */}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          {/* Submit Button */}
          <button type="submit" className="btn btn-purple">
            Login
          </button>
        </form>

        {/* Register Link */}
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>

      {/* Call-to-Action Section */}
      <div className="cta-section">
        <p>Join our community today and start sharing your stories with the world.</p>
      </div>
    </div>
  );
};

export default Login;