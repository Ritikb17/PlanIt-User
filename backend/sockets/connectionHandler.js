const socketMessageController = require('../controllers/socketMessageController');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket);
    socket.on('send-message', (data) => {
      console.log("the DATA is ",data);
      socketMessageController.handleSendMessage(socket, io, data);
    });

    socket.on('get-messages', (data, callback) => {
      console.log("controller of getting messages" ,data);
      socketMessageController.handleGetMessages(socket, data, callback);
      // io.to(socket.id).emit('receive-message', message);
    });

    socket.on('edit-message', (data, callback) => {
      socketMessageController.handleEditMessage(socket, io, data, callback);
    });

    socket.on('delete-message', (data, callback) => {
      socketMessageController.handleDeleteMessage(socket, io, data, callback);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.userId);
    });
  });
};