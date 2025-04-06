import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Auth.css'; // Import the shared CSS file

const Register = () => {
 const [email, setEmail]= useState('');
 const [name, setName]= useState('');
 const [error, setError]= useState('');
 const [password, setPassword]= useState('');
 const [cnfPassword, setCnfPassword]= useState('');
 const [username, setUserName]= useState('');

 const handleEmailChange=(event)=>
 {
  setEmail(event.target.value);
 }
{/*handle password change */}
 const handlePasswordChange=(event)=>
 {
  setPassword(event.target.value);
 }

 const handleUserNameChange=(event)=>
 {
  setUserName(event.target.value);
 }
 const handleCnfPasswordChange=(event)=>
 {
  setCnfPassword(event.target.value);
 }
 const handleSetName=(event)=>
 {
  setName(event.target.value);
 }

 const handelRegister = async (event) => {
  event.preventDefault();
  
  if (password !== cnfPassword) {
      setError("Password Doesn't Match");
      return;
  }

  try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
          email,
          password,
          username,
          name
      }, {
          headers: { "Content-Type": "application/json" }
      });

      // With axios, response data is automatically parsed and available in response.data
      const data = response.data;

      // Store token securely
      localStorage.setItem("token", data.token);

      // Redirect after registration
      window.location.href = "/";
      
  } catch (error) {
      console.error("Registration error:", error);
      
      // Axios wraps the error response in error.response
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
      setError(errorMessage);
  }
};
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
        <form onSubmit={handelRegister}>
          {/* Username Input */}
          <div className="form-group">
            <label htmlFor="name">User Name</label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Enter your username"
              onChange={handleUserNameChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              className="form-control"
              placeholder="Enter your username"
              onChange={handleSetName}
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
              onChange={handlePasswordChange}
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
              onChange={handleCnfPasswordChange}
            />
          </div>
          {/* Error Message */}
          {error && <p style={{ color: 'red' }}>{error}</p>}


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