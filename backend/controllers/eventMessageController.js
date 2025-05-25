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
    console.log("IN THE SEND MESSAGE CONTROLLER OF EVENT", eventId, message, userId);
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            console.log("Event not found");
            throw new Error("Event not found");
        }

        if (!event.members.includes(userId)) {
            console.log("User not a member of this event");
            throw new Error("User not a member of this event");
        }

        // Create the new message object
        const newMessage = {
            message: message,
            sender: userId,
            timestamp: new Date(),
            isEdited: false,
            isDeleted: false
        };

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            {
                $push: {
                    messages: newMessage
                }
            },
            { new: true }
        );

        if (!updatedEvent) {
            console.log("Error in saving message in database");
            throw new Error("Error in saving message in database");
        }

        // Get the last message (the one we just added)
        const savedMessage = updatedEvent.messages[updatedEvent.messages.length - 1];

        callback({
            status: 'success',
            message: savedMessage // Send back the saved message with _id
        });

        // Emit to all clients in the event room
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
        });

    } catch (error) {
        console.error("Error in handleEventSendMessage:", error.message);
        socket.emit("message-error", { error: error.message });
        callback({
            status: 'error',
            message: error.message
        });
    }
},
    handleEventEditMessage: async (socket, userId, io, { eventId, message, messageId }, data, callback) => {
    console.log("IN THE EDIT MESSAGE CONTROLLER OF EVENT", eventId, message);
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            console.log("Event not found");
            throw new Error("Event not found");
        }

        if (!event.members.includes(userId)) {
            console.log("User not found in event");
            throw new Error("User not found in event");
        }

        const messageToEdit = event.messages.id(messageId);
        if (!messageToEdit) {
            throw new Error("Message not found");
        }

        if (messageToEdit.sender.toString() !== userId.toString()) {
            throw new Error("Unauthorized - you can only edit your own messages");
        }

        const updatedEvent = await Event.findOneAndUpdate(
            {
                _id: eventId,
                "messages._id": messageId
            },
            {
                $set: {
                    "messages.$.message": message,
                    "messages.$.isEdited": true,
                    "messages.$.editedAt": new Date()
                }
            },
            { new: true }
        );

        if (!updatedEvent) {
            console.log("Error in editing message in database");
            throw new Error("Error in editing message in database");
        }

        // Find the updated message in the returned document
        const updatedMessage = updatedEvent.messages.id(messageId);
        
        callback({
            status: 'success',
            updatedMessage: {
                _id: updatedMessage._id,
                message: updatedMessage.message,
                isEdited: updatedMessage.isEdited,
                editedAt: updatedMessage.editedAt
            }
        });

        // Emit to all clients in the event room
        io.to(eventId).emit("message-updated", {
            eventId,
            messageId: messageId,
            updatedMessage: {
                message: updatedMessage.message,
                isEdited: updatedMessage.isEdited,
                editedAt: updatedMessage.editedAt
            }
        });

    } catch (error) {
        console.error("Error in handleEventEditMessage:", error.message);
        socket.emit("message-error", { error: error.message });
        callback({
            status: 'error',
            message: error.message
        });
    }
},
handleEventDeleteMessage: async (socket, userId, io, { eventId, messageId }, data, callback) => {
    console.log("IN THE DELETE MESSAGE CONTROLLER OF EVENT", eventId, messageId);
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            console.log("Event not found");
            throw new Error("Event not found");
        }

        if (!event.members.includes(userId)) {
            console.log("User not found in Event");
            throw new Error("User not found in Event");
        }

        const messageToDelete = event.messages.id(messageId);
        if (!messageToDelete) {
            throw new Error("Message not found");
        }

        if (messageToDelete.sender.toString() !== userId.toString()) {
            throw new Error("Unauthorized - you can only delete your own messages");
        }

        const eventObjectId = new mongoose.Types.ObjectId(eventId);
        const messageObjectId = new mongoose.Types.ObjectId(messageId);

        console.log("The Event id is", eventObjectId);
        console.log("The message id is", messageObjectId);

        const updatedEvent = await Event.findOneAndUpdate(
            {
                _id: eventObjectId,
                "messages._id": messageObjectId
            },
            {
                $set: {
                    "messages.$.isDeleted": true,
                    "messages.$.deletedAt": new Date()  // Added deletion timestamp
                }
            },
            { new: true }
        );

        if (!updatedEvent) {
            console.log("Error in deleting message in database");
            throw new Error("Error in deleting message in database");
        }

        // Get the updated message from the returned document
        const deletedMessage = updatedEvent.messages.id(messageId);

        callback({
            status: 'success',
            messageId: messageId,
            deletedAt: deletedMessage.deletedAt
        });

        // Emit to all clients in the event room
        io.to(eventId).emit("message-deleted", {
            eventId,
            messageId: messageId,
            deletedAt: deletedMessage.deletedAt
        });

    } catch (error) {
        console.error("Error in handleEventDeleteMessage:", error.message);
        socket.emit("message-error", { error: error.message });
        callback({
            status: 'error',
            message: error.message
        });
    }
}


}