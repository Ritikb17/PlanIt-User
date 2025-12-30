const mongoose = require('mongoose');
const User = require("../models/User");
const Chat = require('../models/chat');
// const users = new Map();

module.exports = {
  handleSendMessage: async (socket, io, { receiverId, message }, users) => {
    try {
      const _id = socket.user._id;
      const rec_id = receiverId;
      const [user, rec] = await Promise.all([
        User.findById(_id),
        User.findById(rec_id)
      ]);


      if (!user || !rec) {
        console.log("ERROR", "User or receiver not foundXXXXCCCXX")
        throw new Error("User or receiver not found");
      }

      const connectedToOtherUser = rec.connections.some(conn => conn.friend.equals(_id));
      if (!connectedToOtherUser) {
        throw new Error("You are not connected to the other user");
      }

      const connection = user.connections.find(conn => conn.friend.equals(rec._id));
      const isBlocked = user.blockUsers.includes(rec_id);

      if (isBlocked) {
        throw new Error("You blocked the other user");
      }

      const Blocked = rec.blockUsers.includes(rec_id);
      if (Blocked) {
        throw new Error("You have been blocked");
      }

      const chatId = connection.chat;
      if (!chatId) {
        throw new Error("Chat ID not found");
      }

      const cid = new mongoose.Types.ObjectId(chatId);
      const messageJson = {
        sender: _id,
        receiver: rec_id,
        message: message,
      
        timestamp: new Date()
      };

      const updatedChat = await Chat.findByIdAndUpdate(
        cid,
        { $push: { messages: messageJson } },
        { new: true }
      );


      const receiverSocketId = users.get(receiverId);
      console.log("UPDATED CHAT IS  ", updatedChat);
      socket.emit('message-sent', {
        status: 'success'
      });
      console.log("RECEIVER SOCKET ID IS  ", receiverSocketId);

      io.to(receiverSocketId).emit('receive-message', messageJson);
      return {
        status: 'success'
      };


    } catch (error) {
      console.error("Error in sendMessage:", error);
      socket.emit('message-error', error.message);
    }
  },

  handleGetMessages: async (socket, data, callback) => {
  try {
    const _id = socket.user._id;
    const rec_id = data;

    const [user, rec] = await Promise.all([
      User.findById(_id),
      User.findById(rec_id)
    ]);

    if (!user || !rec) {
      throw new Error("User or receiver not found");
    }

    const connectedToOtherUser = rec.connections.some(conn =>
      conn.friend.equals(_id)
    );
    if (!connectedToOtherUser) {
      throw new Error("You are not connected to the other user");
    }

    const connection = user.connections.find(conn =>
      conn.friend.equals(rec._id)
    );

    if (user.blockUsers.includes(rec_id)) {
      throw new Error("You blocked the other user");
    }

    if (rec.blockUsers.includes(_id)) {
      throw new Error("You have been blocked");
    }

    const chatId = connection.chat;
    if (!chatId) {
      throw new Error("Chat ID not found");
    }

    const cid = new mongoose.Types.ObjectId(chatId);

    // 1️⃣ Get messages
    const chat = await Chat.findById(cid).select("messages").lean();

    // 2️⃣ Mark messages as seen
    await Chat.findOneAndUpdate(
      { _id: cid },
      {
        $set: {
          "messages.$[elem].isSeen": true
        }
      },
      {
        arrayFilters: [
          {
            "elem.isSeen": false,
            "elem.receiver": _id
          }
        ]
      }
    );

    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    // 3️⃣ Attach file URLs safely
    const messagesWithUrls = (chat.messages || []).map(msg => ({
      ...msg,
      fileURL: msg.file
        ? `${BASE_URL}/api/messages/get-chat-message-file/${chatId}/${msg.file}`
        : null
    }));

    callback({
      status: "success",
      messages: messagesWithUrls,
      chat_id: cid
    });

  } catch (error) {
    console.error("Error in getMessages:", error);
    callback({
      status: "error",
      message: error.message
    });
  }
},


  handleEditMessage: async (socket, users, io, { messageId, receiverId, newMessage, chatId }, callback) => {
    try {
      const _id = socket.user._id;
      // const rec_id = receiverId;

      // const [user, rec] = await Promise.all([
      //   User.findById(_id),
      //   User.findById(rec_id)
      // ]);

      // if (!user || !rec) {
      //   throw new Error("User not found");
      // }

      // const connection = user.connections.find(conn => conn.friend.equals(rec._id));
      // if (!connection) {
      //   throw new Error("Not connected to this user");
      // }

      // const chatId = connection.chat;
      // if (!chatId) {
      //   throw new Error("Chat not found");
      // }


      const chatObjectId = new mongoose.Types.ObjectId(chatId);
      const messageObjectId = new mongoose.Types.ObjectId(messageId);
      const userObjectId = new mongoose.Types.ObjectId(_id);

      console.log("messageId", messageId, "chatId is ", chatId, "newMessage", newMessage, "userId is ", userObjectId);
      const updatedChat = await Chat.findOneAndUpdate(
        {
          _id: chatObjectId,
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
          arrayFilters: [{ "elem._id": messageObjectId }],
          new: true
        }
      );

      if (!updatedChat) {
        throw new Error("Message not found or not authorized");
      }

      const updatedMessage = Chat.findById(chatId).select("messages")

      // Notify both users
      // io.to(_id).to(rec_id).emit('message-edited', updatedMessage);
      const receiverSocketId = users.get(receiverId);
      console.log("UPDATED message is   ", updatedMessage);

      io.to(receiverSocketId).emit('edit-message');

      callback({
        status: 'success',
        message: updatedMessage
      });

    } catch (error) {
      console.error("Edit message error:", error);
      callback({
        status: 'error',
        message: error.message
      });
    }
  },

  handleDeleteMessage: async (socket, users, io, { messageId, receiverId, chatId }, callback) => {
    try {
      const _id = socket.user._id;

      console.log("in the delete message ");
      // const rec_id = receiverId;

      // const [user, rec] = await Promise.all([
      //   User.findById(_id),
      //   User.findById(rec_id)
      // ]);

      // if (!user || !rec) {
      //   throw new Error("User or receiver not found");
      // }

      // const connection = user.connections.find(conn => conn.friend.equals(rec._id));
      // if (!connection) {
      //   throw new Error("You are not connected to this user");
      // }

      // const chatId = connection.chat;
      // if (!chatId) {
      //   throw new Error("Chat ID not found");
      // }

      const updatedChat = await Chat.findOneAndUpdate(
        {
          _id: chatId,
          "messages._id": messageId,
          "messages.sender": _id
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
        throw new Error("Message not found or you don't have permission");
      }

      const deletedMessage = updatedChat.messages.find(
        msg => msg._id.toString() === messageId
      );

      // // Notify both users
      // io.to(_id).to().emit('message-deleted', {
      //   messageId,
      //   chatId
      // });
      const receiverSocketId = users.get(receiverId);
      console.log("UPDATED id IS  ", receiverSocketId);

      io.to(receiverSocketId).emit('edit-message');

      callback({
        status: 'success',
        message: "Message deleted successfully"
      });

    } catch (error) {
      console.error("Error in deleteMessage:", error);
      callback({
        status: 'error',
        message: error.message
      });
    }
  }
};