const User = require("../models/User");

const editBio = async (req, res) => {
  try {
    const { email, ...updateFields } = req.body; 
    const _id = req.body._id;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    console.log("BODY ",req.body);

    const user = await User.findOneAndUpdate(
      { _id },         
      { $set: updateFields }, 
      { new: true, runValidators: true } 
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Profile updated successfully.", user });
  } catch (error) {

     // Handle duplicate key error
     if (error.code === 11000 && error.keyPattern?.username) {
        return res.status(400).json({
          error: `The username '${error.keyValue.username}' is already taken. Please choose a different one.`,
        });
      }
    console.error("ERROR:", error);
    res.status(500).json({ message: "Server error." ,error:error});
  }


};

const checkUserName = async (req, res) => {
  const { username } = req.query;
  
    try {
        if(!username){
            return res.status(400).json({ message: "send username", allowed: false });
      }
        

      const existingUser = await User.findOne({ username }); // ✅ Use findOne instead of find
        console.log("USERNAME",username);
      if (existingUser) {
        return res.status(200).json({ message: "Username already taken", allowed: false });
      }
  
      res.status(200).json({ message: "Username is available", allowed: true });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
module.exports = { editBio ,checkUserName};
