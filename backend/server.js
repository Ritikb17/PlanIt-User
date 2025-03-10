const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, '', '.env') });
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const { connectDB } = require("./config/db");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
