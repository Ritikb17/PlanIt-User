const User = require("../models/User");
const Chat = require('../models/chat');
const Notification = require('../models/notification')
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

  const selfIdObj = new mongoose.Types.ObjectId(self_id);
  const otherIdObj = new mongoose.Types.ObjectId(other_id);

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
    const isAlreadyConnected = recipientUser.connections.some(
      (connection) => connection.friend.toString() === selfIdObj.toString()
    );
    
    if (isAlreadyConnected) {
      return res.status(400).json({ message: "Already connected" });
    }
   

    if (recipientUser.reciveFollowRequests.includes(self_id)) {
      return res.status(400).json({ message: "Follow request already sent." });
    }
  
    // if (recipientUser.connections.friends.includes(self_id)) {
    //   return res.status(400).json({ message: "Already Connected " });
    // }


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


    const notificationVerification = await Notification.findOneAndUpdate(
      { user: other_id }, 
      {
          $push: {
              notification: { message: `${req.user.username} SEND YOU A FOLLOW REQUEST` ,  type: "follow"}
            , 
          }
      },
      { new: true, upsert: true } 
  );

  console.log("notification is ",notificationVerification);
    res.status(200).json({ message: "Request sent successfully." });

  } catch (error) {
    console.error("ERROR IN SENDING REQUEST:", error);
    res.status(500).json({ message: "Cannot make request", error: error.message });
  }
};
const unsendRequest = async (req, res) => {
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

    // if (recipientUser.reciveFollowRequests.includes(self_id)) {
    //   return res.status(400).json({ message: "Follow request already sent." });
    // }
    // if (recipientUser.connections.friends.includes(self_id)) {
    //   return res.status(400).json({ message: "Already Connected " });
    // }


    const selfIdObj = new mongoose.Types.ObjectId(self_id);
    const otherIdObj = new mongoose.Types.ObjectId(other_id);
    const updatedRecipientUser = await User.findByIdAndUpdate(
      other_id,
      { $pull: { reciveFollowRequests: selfIdObj } }, // Add self_id to reciveFollowRequests
      { new: true } // Return the updated document
    );

    const updatedSenderUser = await User.findByIdAndUpdate(
      self_id,
      { $pull: { sendFollowRequest: otherIdObj } }, // Add other_id to sendFollowRequest
      { new: true } // Return the updated document
    );
    []


    const notificationVerification = await Notification.findOneAndUpdate(
      { user: other_id }, 
      {
          $pull: {
              notification: { message: `${req.user.username} SEND YOU A FOLLOW REQUEST` ,  type: "follow"}
            , 
          }
      },
      { new: true, upsert: true } 
  );

  console.log("notification is ",notificationVerification);
    res.status(200).json({ message: "Request unsent successfully." });

  } catch (error) {
    console.error("ERROR IN SENDING REQUEST:", error);
    res.status(500).json({ message: "error in request unsend", error: error.message });
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

    const notificationVerification = await Notification.findOneAndUpdate(
      { user: otherIdObj },
      {
        $push: {
          notification: {
            message: `${req.user.username} ACCEPTED YOUR FOLLOW REQUEST`, 
            type: "follow", 
          },
        },
      },
      { new: true, upsert: true } 
    );

    console.log("notifiaction",notificationVerification);

    // Return success response
    res.status(200).json({ message: "Request accepted successfully." });

  } catch (error) {
    console.error("ERROR IN ACCEPTING REQUEST:", error);
    res.status(500).json({ message: "Cannot accept request.", error: error.message });
  }
};
const rejectRequest = async (req, res) => {
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
  
    // await User.findByIdAndUpdate(self_id, {
    //   $push: { "connections.friends": otherIdObj, "connections.chats": chatId }
    // });

    // await User.findByIdAndUpdate(other_id, {
    //   $push: { "connections.friends": self_id, "connections.chats": chatId }
    // });

    const notificationVerification = await Notification.findOneAndUpdate(
      { user: other_id }, 
      {
          $push: {
              notification: { message: `${req.user.username} REJECTED YOUR FOLLOW REQUEST ` }
          }
      },
      { new: true, upsert: true } 
  );


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
const getSuggestionForChannelConnectionRequest = async (req, res) => {
  const self_id = req.user._id;
  const channel_id = req.params.channel_id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    if (!mongoose.Types.ObjectId.isValid(self_id) || !mongoose.Types.ObjectId.isValid(channel_id)) {
      return res.status(400).json({ message: "Invalid ID(s)." });
    }

    const currentUser = await User.findById(self_id).select("connections blockUsers sendFollowRequest");
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }

    const friendIds = currentUser.connections.map(connection => connection.friend);
    const blockedUserIds = currentUser.blockUsers;
    const sendRequestUserIds = currentUser.sendFollowRequest;

    const skip = (page - 1) * limit;


    const nonFriends = await User.find({
      _id: {
        $nin: [ ...blockedUserIds, ...sendRequestUserIds, self_id],
      },
      receivedChannelRequest: {
        $not: { $elemMatch: { $eq: channel_id } }
      },
      connectedChannels: { $not: { $elemMatch: { $eq: channel_id } } } 
    })
    .select("username name")
    .skip(skip)
    .limit(limit);

    // const nonFriends = await User.find({
    //   _id: {
    //     $nin: [...blockedUserIds, ...sendRequestUserIds, self_id],
    //   },
      
    //      receivedChannelRequest: { $not: { $elemMatch: { $eq: channel_id } } } ,
    //      connectedChannels: { $not: { $elemMatch: { $eq: channel_id } } } 
      
    // })
    // .select("username name bio")
    // .skip(skip)
    // .limit(limit);

    const totalNonFriends = await User.countDocuments({
      _id: {
        $nin: [...friendIds, ...blockedUserIds, ...sendRequestUserIds, self_id],
      },
      $and: [
        { receivedChannelRequest: { $not: { $elemMatch: { $eq: channel_id } } } },
        { connectedChannels: { $not: { $elemMatch: { $eq: channel_id } } } }
      ]
    });

    const totalPages = Math.ceil(totalNonFriends / limit);

    res.status(200).json({
      message: "List fetched successfully.",
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
      .select("username name")
      .skip(skip)
      .limit(limit);

    const totalNonFriends = await User.countDocuments({
      _id: friendIds
    });

    const followRequestUsers = await User.findById(self_id);
    const idsOfFollowRequestUsers = followRequestUsers.reciveFollowRequests
    const followRequest = await User.find({
      _id: idsOfFollowRequestUsers
    })
      .select("username name")
    //  console.log("FINAL FOLLOW REQUEST USERS", finalFollowRequestUsers);

   

    const totalPages = Math.ceil(totalNonFriends / limit);

    res.status(200).json({
      message: "List of non-friends fetched successfully.",
      friends,
      followRequest,
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
const getConnectionsForChannelConnectionRequest = async (req, res) => {
  const self_id = req.user._id;
  const channel_id = req.params.channel_id; // Assuming you'll pass channel_id as a parameter
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(self_id) || !mongoose.Types.ObjectId.isValid(channel_id)) {
      return res.status(400).json({ message: "Invalid ID(s)." });
    }

    // Get current user's connections (excluding blocked ones)
    const currentUser = await User.findById(self_id).select("connections reciveFollowRequests");
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }

    // Get friend IDs (excluding blocked connections)
    const friendIds = currentUser.connections
      .filter(connection => !connection.isBlocked)
      .map(connection => connection.friend);

    // Pagination setup
    const skip = (page - 1) * limit;

    // Get friends who haven't received a request for this channel
    const friends = await User.find({
      _id: { $in: friendIds },
      receivedChannelRequest: {
        $not: { $elemMatch: { $eq: channel_id } }
      },
      connectedChannels: {
        $not: { $elemMatch: { $eq: channel_id } }
      }
    })
    .select("username name")
    .skip(skip)
    .limit(limit);

    // Count total friends (excluding those with existing channel requests)
    const totalFriends = await User.countDocuments({
      _id: { $in: friendIds },
      receivedChannelRequest: {
        $not: { $elemMatch: { $eq: channel_id } }
      }
    });

    const followRequest = await User.find({
      _id: { $in: currentUser.reciveFollowRequests },
      receivedChannelRequest: {
        $not: { $elemMatch: { $eq: channel_id } }
      }
    })
    .select("username name");

    const totalPages = Math.ceil(totalFriends / limit);

    res.status(200).json({
      message: "List of connections fetched successfully.",
      friends,
      followRequest,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalFriends,
        resultsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING CONNECTIONS:", error);
    res.status(500).json({ message: "Cannot fetch connections.", error: error.message });
  }
};
const BlockUser = async (req, res) => {
  const self_id = req.user._id; // ID of the user who is blocking
  const other_id = req.body._id; // ID of the user to be blocked

  try {
    // Find the user who is blocking
    const selfUser = await User.findById(self_id);
    const otherUser = await User.findById(other_id);

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
      otherUser.connections.push({
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
const getNotification = async ( req, res)=>
{
  let  _id = req.user._id;
  _id = new mongoose.Types.ObjectId(_id);

  try {
    const result = await Notification.find({user:_id});
     console.log("RESULT Is", result);
    res.status(200).json({message:"Notification for users are ",notification:result})
  } catch (error) {
    res.status(400).json({error:error});    
  }
}
const getBlockList = async (req, res) => {
  const self_id = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {

    if (!mongoose.Types.ObjectId.isValid(self_id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const blockUserIds = await User.findById(self_id).select("blockUsers");
    if (!blockUserIds) {
      return res.status(404).json({ message: "Blockuser not found." });
    }
    console.log("blockuser",blockUserIds.blockUsers);
    // const friendIds = currentUser.connections.filter((connection) => !connection.isBlocked).map((connection) => connection.friend);

    const skip = (page - 1) * limit;
    const blockUser = await User.find({
      _id: blockUserIds.blockUsers
    })
      .select("username name")
      .skip(skip)
      .limit(limit);

    const totalNonFriends = await User.countDocuments({
      _id: blockUserIds
    });

    // const followRequestUsers = await User.findById(self_id);
    // const idsOfFollowRequestUsers = followRequestUsers.reciveFollowRequests
    // const followRequest = await User.find({
    //   _id: idsOfFollowRequestUsers
    // })
    //   .select("username name")
    // //  console.log("FINAL FOLLOW REQUEST USERS", finalFollowRequestUsers);

   

    const totalPages = Math.ceil(totalNonFriends / limit);

    res.status(200).json({
      message: "List of non-friends fetched successfully.",
      blockUser,
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
const getUser= async (req,res)=>
{
  const username = req.params.username;
  const self_id = req.user._id;
  const selfIdObj = new mongoose.Types.ObjectId(self_id);

  try {
    const userInfo = await User.findOne({username:username}).select('username bio connections name -_id');
    
    const isAlreadyConnected = userInfo.connections.some(
      (connection) => connection.friend.toString() === selfIdObj.toString()
    );
    
    if(!userInfo)
    {
      res.status(200).json({message:"not found user"})
    }

    res.status(200).json({message:"got user data", userInfo,isAlreadyConnected : isAlreadyConnected});
  } catch (error) {
    res.status(400).json({message:"error in getting user ",error:error});    
  }
}
const alreadySendRequest = async(req,res)=>
{
  const uname = req.params.username;
  const _id = req.user._id;
  try {
    
    const userInfo = await User.findOne({username:uname});
    if (!userInfo) {
      return res.status(404).json({ message: "User not found." });
    }
    const result= userInfo.reciveFollowRequests.includes(_id);
    res.status(200).json({result:result}) 
    
  } catch (error) {
    res.status(400).json({error:error})
    
  }
}

module.exports = { editBio, checkUserName, sendRequest, acceptRequest, getSuggestion, getConnections, BlockUser, unBlockUser, removeUser ,getNotification,rejectRequest,getBlockList,getUser,alreadySendRequest,unsendRequest,getSuggestionForChannelConnectionRequest,getConnectionsForChannelConnectionRequest};
