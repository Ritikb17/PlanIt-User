require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true },
  name: { type: String, require: true },
  profilePicture: {
    type: String,
    default: process.env.DEFAULT_PROFILE_PICTURE_LOCATION || 'default.jpg'
  },
  coverPicture: {
    type: String,
    default: process.env.DEFAULT_COVER_PICTURE_LOCATION || 'defaultCover.jpg'
  },
  bio: { type: String, default: '' },
  email: { type: String, require: true, unique: true },
  password: { type: String, required: true },
  posts: [{ type: Schema.Types.ObjectId, ref: "UserPosts" }],
  connections: [
    {
      friend: { type: Schema.Types.ObjectId, ref: "User" },
      chat: { type: Schema.Types.ObjectId, ref: "Chat" },
      isBlocked: { type: Boolean, default: false }
    }
  ],
  channels: [{ type: Schema.Types.ObjectId, ref: "Channel" }],
  events: [{ type: Schema.Types.ObjectId, ref: "Channel" }],
  connectedChannels: [
    { type: Schema.Types.ObjectId, ref: "Channel" }
  ],
  connectedEvents: [
    { type: Schema.Types.ObjectId, ref: "Event" }
  ],
  sendEventConnectionRequest: [
    { type: Schema.Types.ObjectId, ref: "Event" }
  ],
  receivedEventConnectionRequest: [
    { type: Schema.Types.ObjectId, ref: "Event" }
  ],
  receivedChannelRequest: [
    { type: Schema.Types.ObjectId, ref: "Channel" }
  ],
  sendChannelRequest: [
    { type: Schema.Types.ObjectId, ref: "Channel" }
  ],

  blockChannels: [
    { type: Schema.Types.ObjectId, ref: "Channel" }
  ],
  blockEvents: [
    { type: Schema.Types.ObjectId, ref: "Event" }
  ],
  reciveFollowRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
  sendFollowRequest: [{ type: Schema.Types.ObjectId, ref: "User" }],
  blockUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  events: [
    { type: Schema.Types.ObjectId, ref: "Event" },
    { type: Schema.Types.ObjectId, ref: "Chat" },
  ],
  notifications: [{ type: Schema.Types.ObjectId, ref: "Notification" }],
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


module.exports = mongoose.model("User", UserSchema);