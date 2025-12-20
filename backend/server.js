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
const multer = require('multer');

// Import routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const otherRoutes = require("./routes/otherRoutes");
const channelRoutes = require("./routes/channelRoutes");
const messageRoutes = require("./routes/messageRoutes");
const eventRoutes = require("./routes/eventRoutes");
const pastEventRoutes = require("./routes/pastEventRoutes");
const userPostRoutes = require("./routes/userPostRoutes");
const profilePictureRoutes = require("./routes/profilePictureRoutes");

const { verifyToken } = require("./middlewares/authMiddleware");
const verifySocketToken = require("./middlewares/socketAuthMiddleware");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(cookieParser());

// ✅ Serve static files from public folder
// All images will be accessible via http://localhost:5000/uploads/<path>
app.use('/uploads', (req, res, next) => {
  console.log("🖼 Static file requested:", req.url);
  next();
}, express.static(path.join(__dirname, 'public')));

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
});
io.use(verifySocketToken);
require('./sockets/connectionHandler')(io);

// Routes
app.use('/api/picture', verifyToken, profilePictureRoutes);
app.use('/api/user-post', verifyToken, userPostRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", verifyToken, profileRoutes);
app.use("/api/user", verifyToken, userRoutes);
app.use("/api/other", verifyToken, otherRoutes);
app.use("/api/channel", verifyToken, channelRoutes);
app.use("/api/events", verifyToken, eventRoutes);
app.use('/api/past-events', verifyToken, pastEventRoutes);

// Multer error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    if (error.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ success: false, message: 'Too many files. Only one file allowed.' });
    if (error.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ success: false, message: 'Unexpected field.' });
  }
  if (error.message === 'Only image files are allowed!') return res.status(400).json({ success: false, message: error.message });
  console.error('Upload Error:', error);
  res.status(500).json({ success: false, message: 'File upload failed!' });
});

// General error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ success: false, message: "Server error." });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
