const Event = require('../models/event')
const mongoose = require('mongoose');
// const Chat = require('../models/chat');
module.exports = {

    handleEventGetMessages: async (socket, userId, io, { eventId }, callback) => {
        try {
            const eventObjectId = new mongoose.Types.ObjectId(eventId);
            console.log("EVENT IDDDD IDDD",eventObjectId);
            const event = await Event.findById(eventObjectId);
            if (!event) {
                throw new Error("Event xxxxx not found ");
            }
            // console.log("user id is", userId)
            const include = event.members.includes(userId);
            if (!include) {
                throw new Error("User  Not Found  in Event ");
            }
            callback({
                status: 'success',
                messages: event.messages || [],
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
    handleEventSendMessage: async (socket, userId, io, { eventId, message }, data, callback) => {
        console.log("IN THE SEND MESSAGE CONTROLLER OF EVENT", eventId, message,userId);
        try {

            const event = await Event.findById(eventId);
            if (!event) {
                console.log("Event not found");
                throw new Error("Event not found");
            }

            if (!event.members.includes(userId)) {
                console.log("Event not found in channel");
                throw new Error("Event not found in channel");
            }

            const updatedChannel = await Event.findByIdAndUpdate(
                eventId,
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
            console.log("the new event data is ", updatedChannel);
            if (!updatedChannel) {
                console.log("Error in saving message in database");
                throw new Error("Error in saving message in database");
            }


            callback({
                status: 'success'
            });

            io.to(eventId).emit("new-event-message", {
                eventId,
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
    handleEventEditMessage: async (socket, userId, io, { eventId, message, messageId }, data, callback) => {
        console.log("IN THE EDIT MESSAGExxxxxx CONTROLLER OF CHANNEL", eventId, message);
        try {

            const event = await Event.findById(eventId);
            if (!event) {
                console.log("Channel not found");
                throw new Error("Channel not found");
            }


            if (!event.members.includes(userId)) {
                console.log("User not found in channel");
                throw new Error("User not found in channel");
            }
            const messageToEdit = event.messages.id(messageId);

            if (messageToEdit.sender.toString() !== userId.toString()) {
                throw new Error("Unauthorized - you can only edit your own messages");
            }
            const messageObjectId = new mongoose.Types.ObjectId(messageId);
            const eventObjectId = new mongoose.Types.ObjectId(eventId);
            //  const channelObjectId = mongoose.Types.ObjectId(eventId);
            console.log("the id of message ", messageObjectId)
            console.log("the id of event ", eventObjectId)
            const updatedChannel = await Event.findOneAndUpdate(
                {
                    _id: eventObjectId,
                    "messages._id": messageId
                },
                {
                    $set: {
                        "messages.$.message": message,
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

            const updatedMessage = await Event.findById(eventId).select("messages")
            console.log("UPDATED MESSAGE", updatedMessage);
            // console.log("updated messagexxxxxxxx",message.message);      
            io.to(eventId).emit("new-channel-message", {
                eventId,
                message: {
                    sender: userId,
                    message: updatedMessage,

                    // updated:updatedMessage
                }
            });

        } catch (error) {
            console.error("Error in handleEventEditMessage:", error.message);
            // You might want to emit an error back to the sender
            socket.emit("message-error", { error: error.message });
        }
    },
    handleEventDeleteMessage: async (socket, userId, io, { eventId, messageId }, data, callback) => {
        console.log("IN THE DELETE MESSAGE CONTROLLER OF CHANNEL", eventId, messageId);
        try {

            const channel = await Event.findById(eventId);
            if (!channel) {
                console.log("Event not found");
                throw new Error("Event not found");
            }


            if (!Event.members.includes(userId)) {
                console.log("User not found in Event");
                throw new Error("User not found in Event");
            }
            const messageToEdit = Event.messages.id(messageId);

            if (messageToEdit.sender.toString() !== userId.toString()) {
                throw new Error("Unauthorized - you can only edit your own messages");
            }
            const channelObjectId = new mongoose.Types.ObjectId(eventId)
            const messageObjectId = new mongoose.Types.ObjectId(messageId)

            console.log("the Event id is ", channelObjectId)
            console.log("the message id is ", messageObjectId)
            const updatedChannel = await Event.findOneAndUpdate(
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


            io.to(eventId).emit("new-event-message", {
                eventId,
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