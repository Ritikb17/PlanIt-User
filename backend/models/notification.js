const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    notification: [
      {
        message: { type: String, required: true }, 
        from: { type: Schema.Types.ObjectId, ref: 'User' },
        post: { type: Schema.Types.ObjectId, ref: 'UserPost' },
        channel: { type: Schema.Types.ObjectId, ref: 'Channel' },
        event: { type: Schema.Types.ObjectId, ref: 'Event' },
        date: { type: Date, default: Date.now },
        isSeen: { type: Boolean, default: false }, 
        isDeleted: { type: Boolean, default: false }, 
        type: {
          type: String,
          enum: ['follow', 'post', 'channel', 'event', 'message', 'like'],
          required: true, 
        },
      },
    ],
  },
  { timestamps: true }
);

// Check if the model already exists before creating it
module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);