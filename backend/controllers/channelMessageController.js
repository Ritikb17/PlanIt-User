const Channel = require('../models/channel')
const mongoose = require('mongoose');
const Chat = require('../models/chat');
module.exports = {

    handleGetMessages: async (socket, userId, io, { channelId }, callback) => {
        // const channelIdObj = new mongoose.
        try {
            const channel = await Channel.findOne({ _id: channelId }).populate("messages.pool");
            if (!channel) {
                throw new Error("Channel not found ");
            }
            console.log("user id is", userId)
            const include = channel.members.includes(userId);
            if (!include) {
                throw new Error("User  not found  in channel ");
            }
            callback({
                status: 'success',
                messages: channel.messages || [],
            });


        }
        catch (error) {
            console.error("Error in getMessages:", error);
            callback({
                status: 'error',
                message: error.message
            });
        }

    },
    handleChannelSendMessage: async (socket, data, callback) => {
        try {
            const { channelId, message, userId } = data;
            const io = socket.server;

            console.log("the channel is ",channelId);
            const channel = await Channel.findById(channelId);
            if (!channel) {
                throw new Error("Channel not found");
            }

            if (!channel.members.includes(userId)) {
                throw new Error("User not found in channel");
            }

            // Create new message object with all required fields
            const newMessage = {
                message: message,
                sender: userId,
                timestamp: new Date(),
                isEdited: false,
                isDeleted: false
            };

            const updatedChannel = await Channel.findByIdAndUpdate(
                channelId,
                {
                    $push: {
                        messages: newMessage
                    }
                },
                { new: true }
            );

            if (!updatedChannel) {
                throw new Error("Error saving message");
            }

            // Get the last message (the one we just added)
            const savedMessage = updatedChannel.messages[updatedChannel.messages.length - 1];

            callback({
                status: 'success',
                message: savedMessage
            });

            // Emit to all clients in the channel
            io.to(channelId).emit("new-channel-message", {
                channelId,
                message: savedMessage
            });

        } catch (error) {
            console.error("Send message error:", error.message);
            callback({
                status: 'error',
                message: error.message
            });
            socket.emit("message-error", { error: error.message });
        }
    },
    handleChannelEditMessage: async (socket, userId, io, { channelId, message, messageId }, data, callback) => {
        console.log("IN THE EDIT MESSAGExxxxxx CONTROLLER OF CHANNEL", channelId, message);
        try {

            const channel = await Channel.findById(channelId);
            if (!channel) {
                console.log("Channel not found");
                throw new Error("Channel not found");
            }


            if (!channel.members.includes(userId)) {
                console.log("User not found in channel");
                throw new Error("User not found in channel");
            }
            const messageToEdit = channel.messages.id(messageId);

            if (messageToEdit.sender.toString() !== userId.toString()) {
                throw new Error("Unauthorized - you can only edit your own messages");
            }
            const messageObjectId = new mongoose.Types.ObjectId(messageId);
            const channelObjectId = new mongoose.Types.ObjectId(channelId);
            //  const channelObjectId = mongoose.Types.ObjectId(channelId);
            console.log("the id of message ", messageObjectId)
            console.log("the id of channel ", channelObjectId)
            const updatedChannel = await Channel.findOneAndUpdate(
                {
                    _id: channelId,
                    "messages._id": messageId
                },
                {
                    $set: {
                        "messages.$.message": message.message,
                        "messages.$.isEdited": true
                    }
                },

                {
                    new: true
                }
            );



            if (!updatedChannel) {
                console.log("Error in editing  message in database");
                throw new Error("Error in editing message in database");
            }
            callback({
                status: 'success'
            });

            const updatedMessage = await Channel.findById(channelId).select("messages")
            console.log("UPDATED MESSAGE", updatedMessage);
            // console.log("updated messagexxxxxxxx",message.message);      
            io.to(channelId).emit("new-channel-message", {
                channelId,
                message: {
                    sender: userId,
                    message: updatedMessage,

                    // updated:updatedMessage
                }
            });

        } catch (error) {
            console.error("Error in handleChannelEditMessage:", error.message);
            // You might want to emit an error back to the sender
            socket.emit("message-error", { error: error.message });
        }
    },
    handleChannelDeleteMessage: async (socket, userId, io, { channelId, messageId }, data, callback) => {
        console.log("IN THE DELETE MESSAGE CONTROLLER OF CHANNEL", channelId, messageId);
        try {

            const channel = await Channel.findById(channelId);
            if (!channel) {
                console.log("Channel not found");
                throw new Error("Channel not found");
            }


            if (!channel.members.includes(userId)) {
                console.log("User not found in channel");
                throw new Error("User not found in channel");
            }
            const messageToEdit = channel.messages.id(messageId);

            if (messageToEdit.sender.toString() !== userId.toString()) {
                throw new Error("Unauthorized - you can only edit your own messages");
            }
            const channelObjectId = new mongoose.Types.ObjectId(channelId)
            const messageObjectId = new mongoose.Types.ObjectId(messageId)

            console.log("the channel id is ", channelObjectId)
            console.log("the message id is ", messageObjectId)
            const updatedChannel = await Channel.findOneAndUpdate(
                {
                    _id: channelObjectId,
                    "messages._id": messageObjectId
                },
                {
                    $set: {
                        "messages.$.isDeleted": true,
                        // "messages.$.deletedAt": new Date()  // Optional: add deletion timestamp
                    }
                },
                { new: true }
            );



            if (!updatedChannel) {
                console.log("Error in editing  message in database");
                throw new Error("Error in editing message in database");
            }
            callback({
                status: 'success'
            });

            console.log("now it is calling the channel emmit ")
            io.to(channelId).emit("new-channel-message", {
                channelId
            });

        } catch (error) {
            console.error("Error in handleChannelEditMessage:", error.message);
            // You might want to emit an error back to the sender
            socket.emit("message-error", { error: error.message });
        }
    }
  



}