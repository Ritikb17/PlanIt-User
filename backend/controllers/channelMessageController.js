const Channel = require('../models/channel')
const mongoose = require('mongoose');
const Chat = require('../models/chat');
module.exports = {

    handleGetMessages: async (socket, userId, io, { channelId }, callback) => {
        // const channelIdObj = new mongoose.
        try {
            const channel = await Channel.findOne({ _id: channelId });
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
    handleChannelSendMessage: async (socket, userId, io, { channelId, message }, data, callback) => {
        console.log("IN THE SEND MESSAGE CONTROLLER OF CHANNEL", channelId, message);
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

            const updatedChannel = await Channel.findByIdAndUpdate(
                channelId,
                {
                    $push: {
                        messages: {
                            message: message,
                            sender: userId,

                        }
                    }
                },
                { new: true }
            );
            console.log("the new channel data is ", updatedChannel);
            if (!updatedChannel) {
                console.log("Error in saving message in database");
                throw new Error("Error in saving message in database");
            }


            callback({
                status: 'success'
            });


            //   io.to(channelId).emit("new-channel-message", {
            //       channelId,
            //       message: {
            //           sender: userId,
            //           message: message.message,
            //       }
            //   });

            io.to(channelId).emit("new-channel-message", {
                channelId,
                message: {
                    _id: savedMessage._id,
                    message: savedMessage.message,
                    sender: savedMessage.sender,
                    timestamp: savedMessage.timestamp,
                    isEdited: savedMessage.isEdited,
                    isDeleted: savedMessage.isDeleted
                }
            })

        } catch (error) {
            console.error("Error in handleChannelSendMessage:", error.message);
            // You might want to emit an error back to the sender
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


            io.to(channelId).emit("new-channel-message", {
                channelId,
                message: {
                    sender: userId,
                    message: message.message,
                }
            });

        } catch (error) {
            console.error("Error in handleChannelEditMessage:", error.message);
            // You might want to emit an error back to the sender
            socket.emit("message-error", { error: error.message });
        }
    }


}