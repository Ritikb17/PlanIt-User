const mongoose = require('mongoose');
const User = require("../models/User");
const Chat = require('../models/chat');

const sendMessage = async (req, res) => {
    const _id = req.user._id;
    const rec_id = req.body.reciverId; // Note: "reciverId" might be a typo (should be "receiverId")
    const message = req.body.message; // Fixed typo in variable name

    try {
        const user = await User.findById(_id);
        const rec = await User.findById(rec_id);
     

        if (!user || !rec) {
            return res.status(400).json({ message: "User or receiver not found" });
        }


        const connectedToOtherUser = rec.connections.some(conn => conn.friend.equals(_id));
        if (!connectedToOtherUser) {
            return res.status(403).json({ message: "You are not connected to the other user" });
        }

        // Check if blocked
        const connection = user.connections.find(conn => conn.friend.equals(rec._id));

        const isBlocked = await user.blockUsers.includes(rec_id);
        
        if (isBlocked) {
            return res.status(403).json({ message: "You blocked the other user" });
        }
        const Blocked = await rec.blockUsers.includes(rec_id);
        if (Blocked) {
            return res.status(403).json({ message: "You have been blocked " });
        }




        const chatId = connection.chat; // Ensure this exists
        if (!chatId) {
            return res.status(400).json({ message: "Chat ID not found" });
        }
        const cid = new mongoose.Types.ObjectId(chatId);
        const messageJson = {
            sender: _id,
            receiver: rec_id,
            message: message
        }
        const sendMessage = await Chat.findByIdAndUpdate( cid ,
            { $push: { messages: messageJson } },
            { new: true }
        )
        console.log("message", sendMessage);
        res.status(200).json({ message: "message is being send " });

    } catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
const editmessage = async (req, res) => {
    const _id = req.user._id;
    const rec_id = req.body.receiverId;
    const newMessage = req.body.message;
    const messageId = req.params.messageId;

    try {
        // Validate users and connection
        const user = await User.findById(_id);
        const rec = await User.findById(rec_id);
        
        if (!user || !rec) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check connection
        const connection = user.connections.find(conn => conn.friend.equals(rec._id));
        if (!connection) {
            return res.status(403).json({ message: "Not connected to this user" });
        }

        const chatId = connection.chat;
        if (!chatId) {
            return res.status(400).json({ message: "Chat not found" });
        }

        // Update the specific message using arrayFilters
        const updatedChat = await Chat.findOneAndUpdate(
            {
                _id: chatId,
                "messages._id": messageId,
                "messages.sender": _id
            },
            {
                $set: {
                    "messages.$[elem].message": newMessage,
                    "messages.$[elem].isEdited": true,
                    "messages.$[elem].editedAt": new Date()
                }
            },
            {
                arrayFilters: [{ "elem._id": messageId }],
                new: true
            }
        );

        if (!updatedChat) {
            return res.status(404).json({ message: "Message not found or not authorized" });
        }

        // Find and return the updated message
        const updatedMessage = updatedChat.messages.find(msg => msg._id.equals(messageId));
        
        res.status(200).json({
            message: "Message updated successfully",
            updatedMessage: updatedMessage
        });

    } catch (error) {
        console.error("Edit message error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
const deleteMessage = async (req, res) => {
    const _id = req.user._id;
    const rec_id = req.body.receiverId; // Fixed typo from "reciverId" to "receiverId"
    const messageId = req.params.messageId;

    try {
        // Find the current user and receiver
        const user = await User.findById(_id);
        const rec = await User.findById(rec_id);
        
        if (!user || !rec) {
            return res.status(404).json({ message: "User or receiver not found" });
        }

        // Check if users are connected
        const connection = user.connections.find(conn => conn.friend.equals(rec._id));
        if (!connection) {
            return res.status(403).json({ message: "You are not connected to this user" });
        }

        const chatId = connection.chat;
        if (!chatId) {
            return res.status(400).json({ message: "Chat ID not found" });
        }


        const updatedChat = await Chat.findOneAndUpdate(
            {
                _id: chatId,
                "messages._id": messageId,
              
            },
            {
                $set: {
             
                    "messages.$[elem].isDeleted": true,
                }
            },
            {
                arrayFilters: [{ "elem._id": messageId }],
                new: true
            }
        );



        if (!updatedChat) {
            return res.status(404).json({ 
                message: "Message not found or you don't have permission to delete it" 
            });
        }

        // Find the updated message to return in response
        const editedMessage = updatedChat.messages.find(
            msg => msg._id.toString() === messageId
        );

        res.status(200).json({ 
            message: "Message deleted successfully",
            editedMessage: editedMessage
        });

    } catch (error) {
        console.error("Error in editMessage:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
module.exports = { sendMessage ,editmessage,deleteMessage};
