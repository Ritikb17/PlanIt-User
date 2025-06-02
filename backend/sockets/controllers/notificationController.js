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
      const userNotifications = await Notification.findOne({
        user: userId
      }).select('notification');
      console.log("user notification is",userNotifications);
      const totalNewNotification = userNotifications.notification.filter(
        n => n.isSeen === false
      ).length;
       console.log("NOTIFICATION IN BACKEND ", notifications)
      callback({
        success: true,
        notifications,
        totalNewNotifications: totalNewNotification
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);

      callback({
        success: false,
        error: error.message,
      });
    }
  },
  setNotificationIsSeenTrue: async (data, socket, callback) => {
    try {
      if (!socket.user?._id) {
        throw new Error("Unauthorized: Missing user ID");
      }

      const userId = new mongoose.Types.ObjectId(data.userId);
      console.log("the user id is ", userId);

      // Update the notifications array for this user
      const result = await Notification.findOneAndUpdate(
        { user: userId }, // Find the document by user ID
        {
          $set: {
            "notification.$[].isSeen": true // Update isSeen for all elements in the array
          }
        },
        { new: true } // Return the updated document
      );

      if (!result) {
        throw new Error("No notifications found for this user");
      }

      console.log("NOTIFICATIONS UPDATED IN BACKEND ", result);

      callback({
        success: true,
        message: "All notifications marked as seen",
        notifications: result.notification // Return the updated notifications array
      });
    } catch (error) {
      console.error("Failed to set all notifications:", error);
      callback({
        success: false,
        error: error.message,
      });
    }
  }


};