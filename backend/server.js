require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const otherRoutes = require("./routes/otherRoutes");
const channelRoutes = require("./routes/channelRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { verifyToken } = require("./middlewares/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", verifyToken, profileRoutes);
app.use("/api/user", verifyToken, userRoutes);
app.use("/api/other", verifyToken, otherRoutes);
app.use("/api/channel", verifyToken, channelRoutes);
app.use("/api/message", verifyToken, messageRoutes);
connectDB();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));