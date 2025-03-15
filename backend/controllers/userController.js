const User = require("../models/User");
const Chat = require('../models/chat')
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
  console.log("other iD AND seLF ", other_id, self_id);
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
    // if (recipientUser.connections.friends.includes(self_id)) {
    //   return res.status(400).json({ message: "Already Connected " });
    // }


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
    []

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
    const selfIdObj = new mongoose.Types.ObjectId(self_id);
    const otherIdObj = new mongoose.Types.ObjectId(other_id);
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

    // Check if the other user is already a friend
    // if (selfUser.connections.friends.includes(otherIdObj)) {
    //   return res.status(400).json({ message: "User is already your friend." });
    // }



    await User.findByIdAndUpdate(
      { _id: selfIdObj },
      { $pull: { reciveFollowRequests: otherIdObj } }, // Remove self_id
      { new: true } // Return the updated document
    );

    // Remove other_id from the current user's sendFollowRequest array
    const check1 = await User.findByIdAndUpdate(
      { _id: otherIdObj },
      { $pull: { sendFollowRequest: selfIdObj } }, // Remove other_id
      { new: true } // Return the updated document
    );

    // creating a new chat 
    const chat = await Chat.create({
      members: [otherIdObj, selfIdObj],
    });
    //setting new chat id to new variable 
    let chatId = chat._id;
    // assiging chats to the users 
    await User.findByIdAndUpdate(self_id, {
      $push: {
        connections: {
          friend: otherIdObj,
          chat: chat._id
        }
      }
    });
    await User.findByIdAndUpdate(other_id, {
      $push: {
        connections: {
          friend: self_id,
          chat: chat._id
        }
      }
    });

    // await User.findByIdAndUpdate(self_id, {
    //   $push: { "connections.friends": otherIdObj, "connections.chats": chatId }
    // });

    // await User.findByIdAndUpdate(other_id, {
    //   $push: { "connections.friends": self_id, "connections.chats": chatId }
    // });




    // Return success response
    res.status(200).json({ message: "Request accepted successfully." });

  } catch (error) {
    console.error("ERROR IN ACCEPTING REQUEST:", error);
    res.status(500).json({ message: "Cannot accept request.", error: error.message });
  }
};
const removeUser = async (req, res) => {
  const self_id = req.user._id;
  const other_id = req.body._id;

  try {
    const selfIdObj = new mongoose.Types.ObjectId(self_id);
    const otherIdObj = new mongoose.Types.ObjectId(other_id);

    if (!mongoose.Types.ObjectId.isValid(other_id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const recipientUser = await User.findById(other_id);
    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient user not found." });
    }

    const selfUser = await User.findById(self_id);
    if (!selfUser) {
      return res.status(404).json({ message: "Current user not found." });
    }

    const chat = await Chat.create({
      members: [otherIdObj, selfIdObj],
    });

    await User.findByIdAndUpdate(self_id, {
      $pull: {
        connections: {
          friend: otherIdObj
        }
      }
    });
    await User.findByIdAndUpdate(other_id, {
      $pull: {
        connections: {
          friend: self_id
        }
      }
    });

    // Return success response
    res.status(200).json({ message: "remove successfully." });

  } catch (error) {
    console.error("ERROR IN ACCEPTING REQUEST:", error);
    res.status(500).json({ message: "Cannot accept request.", error: error.message });
  }
};
const getSuggestion = async (req, res) => {
  const self_id = req.user._id; // ID of the current user
  const page = parseInt(req.query.page) || 1; // Current page (default: 1)
  const limit = parseInt(req.query.limit) || 10; // Number of results per page (default: 10)

  try {
    // Validate if self_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(self_id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    // Find the current user to get their list of friends, blocked users, and sent follow requests
    const currentUser = await User.findById(self_id).select("connections blockUsers sendFollowRequest");
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }

    // Extract the list of friend IDs, blocked user IDs, and sent follow request IDs
    const friendIds = currentUser.connections.map((connection) => connection.friend);
    const blockedUserIds = currentUser.blockUsers;
    const sendRequestUserIds = currentUser.sendFollowRequest;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Find users who are not in the current user's friends list, not blocked, not in sendFollowRequest, and not the current user
    const nonFriends = await User.find({
      _id: {
        $nin: [...friendIds, ...blockedUserIds, ...sendRequestUserIds, self_id], // Exclude friends, blocked users, sent follow requests, and the current user
      },
    })
      .select("username name bio") // Select only necessary fields
      .skip(skip) // Skip documents for pagination
      .limit(limit); // Limit the number of results per page

    // Count the total number of non-friends (for pagination metadata)
    const totalNonFriends = await User.countDocuments({
      _id: {
        $nin: [...friendIds, ...blockedUserIds, ...sendRequestUserIds, self_id], // Exclude friends, blocked users, sent follow requests, and the current user
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalNonFriends / limit);

    // Return the list of non-friends with pagination metadata
    res.status(200).json({
      message: "List of non-friends fetched successfully.",
      nonFriends,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalNonFriends,
        resultsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING NON-FRIENDS:", error);
    res.status(500).json({ message: "Cannot fetch non-friends.", error: error.message });
  }
};
const getConnections = async (req, res) => {
  const self_id = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {

    if (!mongoose.Types.ObjectId.isValid(self_id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const currentUser = await User.findById(self_id).select("connections");
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }
    const friendIds = currentUser.connections.filter((connection) => !connection.isBlocked).map((connection) => connection.friend);

    const skip = (page - 1) * limit;
    const friends = await User.find({
      _id: friendIds
    })
      .select("username name bio")
      .skip(skip)
      .limit(limit);

    const totalNonFriends = await User.countDocuments({
      _id: friendIds
    });

    const totalPages = Math.ceil(totalNonFriends / limit);

    res.status(200).json({
      message: "List of non-friends fetched successfully.",
      friends,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalNonFriends,
        resultsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING NON-FRIENDS:", error);
    res.status(500).json({ message: "Cannot fetch non-friends.", error: error.message });
  }
};
const BlockUser = async (req, res) => {
  const self_id = req.user._id; // ID of the user who is blocking
  const other_id = req.body._id; // ID of the user to be blocked

  try {
    // Find the user who is blocking
    const selfUser = await User.findById(self_id);

    // Check if the other user is already blocked
    const isAlreadyBlocked = selfUser.blockUsers.includes(other_id);
    if (isAlreadyBlocked) {
      return res.status(400).json({ message: 'User is already blocked' });
    }

    // Add the other user to the blockUsers array
    selfUser.blockUsers.push(other_id);

    // Update the connections array to set isBlocked to true for the blocked user
    const connectionIndex = selfUser.connections.findIndex(
      (conn) => conn.friend.toString() === other_id.toString()
    );

    if (connectionIndex !== -1) {
      selfUser.connections[connectionIndex].isBlocked = true;
    } else {
      // If the user is not in the connections array, add them with isBlocked set to true
      selfUser.connections.push({
        friend: other_id,
        isBlocked: true,
      });
    }

    // Save the updated user document
    await selfUser.save();

    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(400).json({ message: 'Error blocking user', error: error.message });
  }
};
const unBlockUser = async (req, res) => {
  const self_id = req.user._id;
  const other_id = req.body._id;

  try {

    const selfUser = await User.findById(self_id);

    const isAlreadyBlocked = selfUser.blockUsers.includes(other_id);
    if (!isAlreadyBlocked) {
      return res.status(400).json({ message: 'User is already unblock' });
    }

    selfUser.blockUsers.pull(other_id);

    // Update the connections array to set isBlocked to true for the blocked user
    const connectionIndex = selfUser.connections.findIndex(
      (conn) => conn.friend.toString() === other_id.toString()
    );

    if (connectionIndex !== -1) {
      selfUser.connections[connectionIndex].isBlocked = false;
    }
    // else {
    //   // If the user is not in the connections array, add them with isBlocked set to true
    //   selfUser.connections.push({
    //     friend: other_id,
    //     isBlocked: true,
    //   });
    // }

    await selfUser.save();

    res.status(200).json({ message: 'User Unblock successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(400).json({ message: 'Error unblocking  user', error: error.message });
  }
};

module.exports = { editBio, checkUserName, sendRequest, acceptRequest, getSuggestion, getConnections, BlockUser, unBlockUser, removeUser };
