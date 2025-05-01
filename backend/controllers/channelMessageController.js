const Channel =  require('../models/channel')

module.exports={

    handleGetMessages : async(socket ,io,{channelId,userId},callback)=>
    {
        try {
        const channel = await  Channel.findOne(channelId);
        if(!channel)
        {
            throw new Error ("Channel not found ");
        }

        const include = channel.members.includes(userId);
        if(!include)
            {
                throw new Error ("User  not found  in channel ");
            }

            callback({
                status: 'success',
                messages: channel.message || [],
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
    handleChannelSendMessage: async (socket,userId, io, { channelId, message }, data,callback) => {
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
  
          if (!updatedChannel) {
              console.log("Error in saving message in database");
              throw new Error("Error in saving message in database");
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
          console.error("Error in handleChannelSendMessage:", error.message);
          // You might want to emit an error back to the sender
          socket.emit("message-error", { error: error.message });
      }
  },
    handleChannelEditMessage: async (socket,userId, io, { channelId, message,messageId }, data,callback) => {
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
          const messageToEdit = channel.messages.id(messageId);

          if (messageToEdit.sender.toString() !== userId.toString()) {
            throw new Error("Unauthorized - you can only edit your own messages");
        }
  
          const updatedChannel = await Channel.findByIdAndUpdate(
              {_id:channelId,
                "messages._id":messageId
              },
              {
                $set: {
                    "messages.$.message": message.message,
                    "messages.$.isEdited": true
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
  },
    handleChannelDeleteMessage: async (socket,userId, io, { channelId, message,messageId }, data,callback) => {
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
          const messageToEdit = channel.messages.id(messageId);

          if (messageToEdit.sender.toString() !== userId.toString()) {
            throw new Error("Unauthorized - you can only edit your own messages");
        }
  
          const updatedChannel = await Channel.findByIdAndUpdate(
              {_id:channelId,
                "messages._id":messageId
              },
              {
                $set: {
                    "messages.$.message": message.message,
                    "messages.$.isDeleted": true
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