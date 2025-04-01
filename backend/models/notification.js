const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference to the User model
    notification: [
      {
        message: { type: String, required: true }, 
        isSeen: { type: Boolean, default: false }, 
        type: {
          type: String,
          enum: ['follow', 'post','channel'], 
          required: true, 
        },
      },
    ],
  },
  { timestamps: true } // Enable automatic timestamps (createdAt and updatedAt)
);

module.exports = mongoose.model('Notification', notificationSchema); // Corrected model name