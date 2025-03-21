const mongoose = require('mongoose');
const User = require("../models/User");
const searchUser = async (req, res) => {
    const searchTerm = req.params.search; 
  
    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required." });
    }
  
    try {
     
      const result = await User.find({
        username: { $regex: searchTerm, $options: "i" }, 
      }).select('username name');
  
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "No users found." });
      }
  
      res.status(200).json({ message: "Search results", result });
    } catch (error) {
      console.error("Error in searching:", error);
      res.status(500).json({ message: "Error in searching", error: error.message });
    }
  };
module.exports ={searchUser};