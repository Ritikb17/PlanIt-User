const socketMessageController = require('../controllers/socketMessageController');
const users = new Map(); 
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket);
    const userId = socket.user?._id?.toString();
    if (userId) {
      users.set(userId, socket.id);
      console.log('Users Map:', Array.from(users.entries()));
    }
    console.log('Users Map:', Array.from(users.entries()));



    socket.on('send-message', (data) => {
      console.log("the DATA is ",data);
     
      
      socketMessageController.handleSendMessage(socket, io, data,users);
    });

    socket.on('get-messages', (data, callback) => {
      console.log("controller of getting messages" ,data);
      socketMessageController.handleGetMessages(socket, data, callback);
    
    });

    socket.on('edit-message', (data, callback) => {
      socketMessageController.handleEditMessage(
        socket, 
        users,   // Assuming `users` is a Map/object tracking connected users
        io,      // Pass the `io` instance
        data,    // Destructured as { messageId, newMessage, chatId }
        callback
      );
    });

    socket.on('delete-message', (data, callback) => {
      socketMessageController.handleDeleteMessage(socket,users, io, data, callback);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.userId);
    });
  });
};
