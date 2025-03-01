import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css'; // Import the shared CSS file

const Register = () => {
  return (
    <div className="auth-page">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Welcome to SocialApp</h1>
        <p className="tagline">Connect with friends and share your moments</p>
      </div>

      {/* Register Form */}
      <div className="auth-form">
        <h2>Register</h2>
        <form>
          {/* Name Input */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              className="form-control"
              placeholder="Enter your full name"
            />
          </div>

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

          {/* Confirm Password Input */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              placeholder="Confirm your password"
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-purple">
            Register
          </button>
        </form>

        {/* Login Link */}
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>

      {/* Call-to-Action Section */}
      <div className="cta-section">
        <p>Join our community today and start sharing your stories with the world.</p>
      </div>
    </div>
  );
};

export default Register;