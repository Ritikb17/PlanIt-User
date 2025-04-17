const socketMessageController = require('../controllers/socketMessageController');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.userId);
    socket.on('send-message', (data) => {
      socketMessageController.handleSendMessage(socket, io, data);
    });

    socket.on('get-messages', (data, callback) => {
      socketMessageController.handleGetMessages(socket, data, callback);
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