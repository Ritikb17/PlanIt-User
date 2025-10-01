const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference to the User model
    notification: [
      {
        message: { type: String, required: true }, 
        from: { type: Schema.Types.ObjectId, ref: 'User' }, // User who triggered the notification
        post: { type: Schema.Types.ObjectId, ref: 'UserPost' }, // Reference to the related post, if applicable
        channel: { type: Schema.Types.ObjectId, ref: 'Channel' }, // Reference to the related channel, if applicable
        event: { type: Schema.Types.ObjectId, ref: 'Event' }, // Reference to the related event, if applicable
        date: { type: Date, default: Date.now }, // Timestamp of the notification
        isSeen: { type: Boolean, default: false }, 
        isDeleted:{ type: Boolean, default: false }, 
        type: {
          type: String,
          enum: ['follow', 'post','channel','event','message','like'], // Add other types as needed
          required: true, 
        },
      },
    ],
  },
  { timestamps: true } // Enable automatic timestamps (createdAt and updatedAt)
);

module.exports = mongoose.model('Notification', notificationSchema); // Corrected model name