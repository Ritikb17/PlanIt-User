const socketMessageController = require('../controllers/socketMessageController');
const channelMessageController = require('../controllers/channelMessageController');
const eventMessageController = require('../controllers/eventMessageController');
const notificationController = require('./controllers/notificationController');
const users = new Map();
module.exports = (io) => {
  io.on('connection', (socket) => {

    const userId = socket.user?._id?.toString();
    if (userId) {
      users.set(userId, socket.id);

    }
    console.log('Users Map:', Array.from(users.entries()));
    socket.on('send-message', (data) => {
      console.log("the DATA is ", data);
      socketMessageController.handleSendMessage(socket, io, data, users);
    });
    socket.on('get-messages', (data, callback) => {
      console.log("controller of getting messages", data);
      socketMessageController.handleGetMessages(socket, data, callback);
    });

    socket.on('edit-message', (data, callback) => {
      socketMessageController.handleEditMessage(
        socket,
        users,
        io,
        data,
        callback
      );
    });
    socket.on('delete-message', (data, callback) => {
      console.log("in the handler of delete message");
      socketMessageController.handleDeleteMessage(socket, users, io, data, callback);
    });

    ////////////////////channel handlers /////////////////////

    // socket.on("join-room", () => {

    //   console.log("the new user in in te room ");
    //   socket.join(roomId); 

    // });
    socket.on("join-channel", (data) => {
      console.log(data.text); // "Hello!"
      socket.join(data.channelId);
      console.log("channel socket is connected for user ", data);

      // io.to(data.channelId).emit("new-message", {
      //   sender: data.userId,
      //   text: data.text,
      // });
    });
    socket.on('send-message-to-channel', (data, callback) => {
      try {
        const userId = socket.user?._id?.toString();
        if (!userId) {
          throw new Error('User not authenticated');
        }

        console.log("Received message data:", data);

        // Combine the incoming data with userId
        const messageData = {
          ...data,
          userId: userId
        };

        // Call controller with proper parameters
        channelMessageController.handleChannelSendMessage(
          socket,
          messageData, // Combined data object
          callback    // Callback function
        );
      } catch (error) {
        console.error("Handler error:", error.message);
        if (typeof callback === 'function') {
          callback({
            status: 'error',
            message: error.message
          });
        }
        socket.emit('message-error', {
          error: error.message
        });
      }
    });
    socket.on('delete-message-of-the-channel', (data, callback) => {
      const userId = socket.user?._id?.toString();
      console.log("the DATA is ", data);
      console.log("IN THE DELETE MESSAGE OF CHANNEL HANDLER", data);
      channelMessageController.handleChannelDeleteMessage(socket, userId, io, data, users, callback);
    })
    socket.on('get-message-of-the-channel', (data, callback) => {
      const userId = socket.user?._id?.toString();

      console.log("in the channel get handler ", data, userId);
      console.log("the DATA is ", data);
      channelMessageController.handleGetMessages(socket, userId, io, data, callback);
    })
    socket.on('edit-message-of-the-channel', (data, callback) => {
      const userId = socket.user?._id?.toString();
      // console.log("IN THE EDIT HANDLER OF THE CHANNEL  ",data);
      channelMessageController.handleChannelEditMessage(socket, userId, io, data, users, callback);
    })
    ////////////////////////event handlers //////////////////////////
    socket.on("join-event", (data) => {
      console.log(data.text); // "Hello!"
      socket.join(data.eventId);
      console.log("event socket is connected  ", data);

      // io.to(data.channelId).emit("new-message", {
      //   sender: data.userId,
      //   text: data.text,
      // });
    });
    socket.on('send-message-to-event', (data, callback) => {
      const userId = socket.user?._id?.toString();
      console.log("IN THE SEND MESSSAGE TO EVENT HANDLER the DATA is ", data);
      eventMessageController.handleEventSendMessage(socket, userId, io, data, users, callback);
    })
    socket.on('delete-message-of-the-event', (data, callback) => {
      try {
        const userId = socket.user?._id?.toString();
        if (!userId) {
          throw new Error('User not authenticated');
        }

        console.log("Delete message request:", {
          eventId: data.eventId,
          messageId: data.messageId,
          userId
        });

        // Call controller with proper parameters
        eventMessageController.handleEventDeleteMessage(
          socket,
          { ...data, userId }, // Combine data with userId
          callback
        );
      } catch (error) {
        console.error("Handler error:", error.message);
        if (typeof callback === 'function') {
          callback({
            status: 'error',
            message: error.message
          });
        }
        socket.emit('message-error', {
          error: error.message
        });
      }
    });
    socket.on('get-message-of-the-event', (data, callback) => {
      const userId = socket.user?._id?.toString();

      console.log("IN THE GET MESSAGE EVENT HANDLER", data, userId);
      console.log("the DATA is ", data);
      eventMessageController.handleEventGetMessages(socket, userId, io, data, callback);
    })
    socket.on('edit-message-of-the-event', (data, callback) => {
      const userId = socket.user?._id?.toString();
      console.log("IN THE EDIT HANDLER OF THE EVENT  ", data);
      eventMessageController.handleEventEditMessage(socket, userId, io, data, users, callback);
    })

////////////////////////////NOTIFICATION ///////////////////////////
    socket.on("join-notification", (data) => {
  try {
    // Validate incoming data
    if (!data) {
      throw new Error("No data received in join-notification");
    }
    
    if (!data.userId) {
      throw new Error("eventId is required in join-notification data");
    }

    console.log("JOIN NOTIFICATION", data);
    
   
    socket.join(data.eventId, (error) => {
      if (error) {
        console.error("Error joining room:", error.message);
        socket.emit("join-error", {
          eventId: data.eventId,
          message: "Failed to join notification room"
        });
      } else {
        console.log(`Successfully joined room: ${data.eventId}`);
        // Optional: emit success message back to client
        socket.emit("join-success", {
          eventId: data.userId,
          message: "Successfully joined notification room"
        });
      }
    });
    
  } catch (error) {
    console.error("Error in join-notification handler:", error.message);
    // Emit error details to client if needed
    socket.emit("join-error", {
      eventId: data?.eventId || "unknown",
      message: error.message
    });
  }
    });
    socket.on("get-notification",(data,callback)=>
    {
      console.log("IN THE GET NOTIFICATION HANDLER OF THE EVENT  ", data);
      notificationController.getNotifications(socket, data, callback);
    })
    socket.on("set-notification-isSeen",(data,callback)=>
    {
      console.log("IN THE GET NOTIFICATION HANDLER OF THE EVENT  ", data);
      notificationController.setNotificationIsSeenTrue, data, callback);
    })




    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.userId);
    });
  });
};
