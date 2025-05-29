const mongoose = require('mongoose');
const Notification = require("../../models/notification");
module.exports = {
  getNotifications: async (socket, data, callback) => {
    try {
      if (!socket.user?._id) {
        throw new Error("Unauthorized: Missing user ID");
      }

      const userId = new mongoose.Types.ObjectId(socket.user._id);
      const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });

     console.log("NOTIFICATION IN BACKEND ",notifications)
      callback({
        success: true,
        notifications,
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);

      callback({
        success: false,
        error: error.message,
      });
    }
  },
  
 
};