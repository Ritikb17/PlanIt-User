const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const JWT_SECRET = process.env.JWT_SECRET;
const Notfication = require("../models/notification");

// Register a new user
const register = async (req, res) => {
  try {
      const { username, email, password, name } = req.body;

      // Check for existing username
      const existingUser = await User.findOne({ username });
      if (existingUser) {
          return res.status(400).json({ message: "Username is already taken" });
      }

      // Check for existing email
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
          return res.status(400).json({ message: "Email is already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = new User({ 
          username, 
          email, 
          password: hashedPassword, 
          name 
      });
      
      await user.save();

      // Create notification
      const notification = new Notfication({ 
          user: user._id  // No need for ObjectId conversion here
      });
      await notification.save();

      // Generate token
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

      res.status(201).json({ 
          message: "User registered successfully", 
          token 
      });

  } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
          error: "An error occurred during registration",
          details: error.message 
      });
  }
}

// Login user
const login = async (req, res) => {
  try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
      res.json({ token });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
}
// Logout user
const logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully." });
};

module.exports = { register, login, logout };