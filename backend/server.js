require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // Add multer import for error handling

// Import routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const otherRoutes = require("./routes/otherRoutes");
const channelRoutes = require("./routes/channelRoutes");
const messageRoutes = require("./routes/messageRoutes");
const eventRoutes = require("./routes/eventRoutes");
const userPostRoutes = require("./routes/userPostRoutes"); // Added user post routes
const profilePictureRoutes = require("./routes/profilePictureRoutes"); // Moved up with other routes

const { verifyToken } = require("./middlewares/authMiddleware");
const verifySocketToken = require("./middlewares/socketAuthMiddleware");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Socket.IO middleware
io.use(verifySocketToken);

// Initialize sockets
require('./sockets/connectionHandler')(io);

// Routes - Profile picture routes should come before general error handling
app.use('/api/picture',verifyToken, profilePictureRoutes);
app.use('/api/user-post',verifyToken, userPostRoutes); // Added user post routes with token verification
app.use("/api/auth", authRoutes);
app.use("/api/profile", verifyToken, profileRoutes);
app.use("/api/user", verifyToken, userRoutes);
app.use("/api/other", verifyToken, otherRoutes);
app.use("/api/channel", verifyToken, channelRoutes);
app.use("/api/events", verifyToken, eventRoutes);
// app.use("/api/message", verifyToken, messageRoutes);

// Error handling middleware for Multer - Moved after routes
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) { // Now multer is defined
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field. Please use "profilePicture" as the field name.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  console.error('Upload Error:', error);
  res.status(500).json({
    success: false,
    message: 'File upload failed!'
  });
});
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public')));

// General error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    success: false,
    message: "Server error." 
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO available at ws://localhost:${PORT}`);
  console.log(`Uploads served from: ${path.join(__dirname, 'public/uploads')}`);
});