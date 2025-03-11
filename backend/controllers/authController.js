const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");

// Register a new user
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists." });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate tokens
    const token = generateToken(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
    const refreshToken = generateToken(user._id, process.env.REFRESH_SECRET, process.env.REFRESH_EXPIRES_IN);

    // Set refresh token in an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

// Logout user
const logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully." });
};

module.exports = { register, login, logout };