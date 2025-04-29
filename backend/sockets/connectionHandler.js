const socketMessageController = require('../controllers/socketMessageController');
const channelMessageController = require('../controllers/channelMessageController');
const users = new Map(); 
module.exports = (io) => {
  io.on('connection', (socket) => {

    const userId = socket.user?._id?.toString();
    if (userId) {
      users.set(userId, socket.id);
    
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
        users,   
        io,     
        data,    
        callback
      );
    });
    socket.on('delete-message', (data, callback) => {
      socketMessageController.handleGetMessages(socket,users, io, data, callback);
    });

    ////////////////////channel handlers /////////////////////

    // socket.on("join-room", () => {

    //   console.log("the new user in in te room ");
    //   socket.join(roomId); 
      
    // });
    socket.on("join-channel", (data) => {
      console.log(data.text); // "Hello!"
      socket.join(data.channelId);
      console.log("channel socket is connected for user ")

      // io.to(data.channelId).emit("new-message", {
      //   sender: data.userId,
      //   text: data.text,
      // });
    });;

    socket.on('send-message-to-channel',(data,callback)=>
    { const userId = socket.user?._id?.toString();
      console.log("the DATA is ",data);
      channelMessageController.handleChannelSendMessage(socket,userId, io, data,users,callback);
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.userId);
    });
  });
};
