const User = require("../models/User");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId; 
const editBio = async (req, res) => {
  try {
    const { email, ...updateFields } = req.body;
    const _id = req.body._id;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    console.log("BODY ", req.body);

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
    res.status(500).json({ message: "Server error.", error: error });
  }


};

const checkUserName = async (req, res) => {
  const { username } = req.query;

  try {
    if (!username) {
      return res.status(400).json({ message: "send username", allowed: false });
    }


    const existingUser = await User.findOne({ username }); // ✅ Use findOne instead of find
    console.log("USERNAME", username);
    if (existingUser) {
      return res.status(200).json({ message: "Username already taken", allowed: false });
    }

    res.status(200).json({ message: "Username is available", allowed: true });
  } catch (error) {
    console.error("Error checking username:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const sendRequest = async (req, res) => {
  let other_id = req.body._id; // ID of the user to send the request to
  let self_id = req.user._id; // ID of the sending user
  console.log("other iD AND seLF ",other_id,self_id);
  self_id = self_id.toString();


  try {

    if (!mongoose.Types.ObjectId.isValid(other_id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const recipientUser = await User.findById(other_id);
    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient user not found." });
    }

    if (recipientUser.blockUsers.includes(self_id)) {
      return res.status(400).json({ message: "You are blocked by the user." });
    }

    if (recipientUser.reciveFollowRequests.includes(self_id)) {
      return res.status(400).json({ message: "Follow request already sent." });
    }
    if (recipientUser.connections.friends.includes(self_id)) {
      return res.status(400).json({ message: "Already Connected " });
    }


    const selfIdObj = new mongoose.Types.ObjectId(self_id);
    const otherIdObj = new mongoose.Types.ObjectId(other_id);
    const updatedRecipientUser = await User.findByIdAndUpdate(
      other_id,
      { $push: { reciveFollowRequests: selfIdObj } }, // Add self_id to reciveFollowRequests
      { new: true } // Return the updated document
    );

    const updatedSenderUser = await User.findByIdAndUpdate(
      self_id,
      { $push: { sendFollowRequest: otherIdObj } }, // Add other_id to sendFollowRequest
      { new: true } // Return the updated document
    );
    res.status(200).json({ message: "Request sent successfully." });

  } catch (error) {
    console.error("ERROR IN SENDING REQUEST:", error);
    res.status(500).json({ message: "Cannot make request", error: error.message });
  }
};


const acceptRequest = async (req, res) => {
  const self_id = req.user._id; // ID of the current user
  const other_id = req.body._id; // ID of the user who sent the request

  try {
    // Validate if other_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(other_id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    // Find the recipient user (the one who sent the request)
    const recipientUser = await User.findById(other_id);
    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient user not found." });
    }

    // Find the current user
    const selfUser = await User.findById(self_id);
    if (!selfUser) {
      return res.status(404).json({ message: "Current user not found." });
    }

    // Check if the other user is in the current user's block list
    if (recipientUser.blockUsers.includes(self_id)) {
      return res.status(400).json({ message: "Other user is in your block list." });
    }

    // // Check if the other user is already a friend
    // if (selfUser.connections.friends.includes(other_id)) {
    //   return res.status(400).json({ message: "User is already your friend." });
    // }

    const selfIdObj = new mongoose.Types.ObjectId(self_id);
const otherIdObj =   new mongoose.Types.ObjectId(other_id);

console.log("___________>>>>>>>>>>>>>>",selfIdObj,otherIdObj);
    // Remove self_id from the recipient's reciveFollowRequests array
    await User.findByIdAndUpdate(
      {_id:selfIdObj},
      { $pull: { reciveFollowRequests: otherIdObj } }, // Remove self_id
      { new: true } // Return the updated document
    );

    // Remove other_id from the current user's sendFollowRequest array
    const check1 =await User.findByIdAndUpdate(
      {_id:otherIdObj},
      { $pull: { sendFollowRequest: selfIdObj } }, // Remove other_id
      { new: true } // Return the updated document
    );
     if(check1)

      {
        console.log("working ",check1);
      }
    // Add other_id to the current user's friends list
    await User.findByIdAndUpdate(
      self_id,
      { $push: { "connections.friends": other_id } }, // Add other_id
      { new: true } // Return the updated document
    );

    // Add self_id to the recipient user's friends list
    await User.findByIdAndUpdate(
      other_id,
      { $push: { "connections.friends": self_id } }, // Add self_id
      { new: true } // Return the updated document
    );

    // Return success response
    res.status(200).json({ message: "Request accepted successfully." });

  } catch (error) {
    console.error("ERROR IN ACCEPTING REQUEST:", error);
    res.status(500).json({ message: "Cannot accept request.", error: error.message });
  }
};




module.exports = { editBio, checkUserName, sendRequest, acceptRequest };
