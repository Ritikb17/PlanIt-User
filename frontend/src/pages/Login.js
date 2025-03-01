import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css'; // Import the shared CSS file

const Login = () => {
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
        <form>
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Enter your email"
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
            />
          </div>

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