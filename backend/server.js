require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Import routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const otherRoutes = require("./routes/otherRoutes");
const channelRoutes = require("./routes/channelRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { verifyToken } = require("./middlewares/authMiddleware");
const { verifySocketToken } = require("./middlewares/socketAuthMiddleware");

// Initialize app
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

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(cookieParser());

// Database connection
connectDB();

// Socket.IO authentication
io.use(verifySocketToken);

require('./sockets/connectionHandler')(io);

app.use("/api/auth", authRoutes);
app.use("/api/profile", verifyToken, profileRoutes);
app.use("/api/user", verifyToken, userRoutes);
app.use("/api/other", verifyToken, otherRoutes);
app.use("/api/channel", verifyToken, channelRoutes);
// app.use("/api/message", verifyToken, messageRoutes);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO available at ws://localhost:${PORT}`);
});