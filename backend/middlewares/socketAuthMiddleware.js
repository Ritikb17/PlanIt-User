const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifySocketToken = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log("🟡 Socket Token Received:", token);

    if (!token) {
      console.log("🔴 No token provided");
      return next(new Error('Authentication error: No token provided'));
    }

    // Optional: Decode without verifying just for debugging
    try {
      const debugDecoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log("🧩 Decoded Token Payload:", debugDecoded);
    } catch (err) {
      console.warn("⚠️ Token decoding failed");
    }

    // Official JWT verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ JWT Verified:", decoded);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log("🔴 User not found for ID:", decoded.id);
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    console.log("🟢 Socket authenticated for:", user._id);
    next();

  } catch (error) {
    console.error("❌ Socket auth error:", error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = verifySocketToken;
