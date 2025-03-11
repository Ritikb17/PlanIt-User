const jwt = require("jsonwebtoken");
const User = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = async (req, res, next) => {
  try {
    // Extract the authorization header
    let authHeader = req.header("Authorization");
    
    // Check if the header is missing or doesn't start with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    }

    // Extract the token from the "Bearer <token>" string
    const token = authHeader.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find the user based on the decoded id
    const user = await User.findById(decoded.id).select("-password"); // Exclude password

    // If the user isn't found, return an error
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    // Attach the user to the request object
    req.user = user;

    // Proceed to the next middleware
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = { verifyToken };
