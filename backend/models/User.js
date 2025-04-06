const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Channel = require("./channel");

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true },
  name: { type: String, require: true },
  bio: { type: String, default: '' },
  email: { type: String, require: true ,unique : true},
  password: { type: String, required: true },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  connections: [
    {
      friend: { type: Schema.Types.ObjectId, ref: "User" },
      chat: { type: Schema.Types.ObjectId, ref: "Chat" },
      isBlocked: { type: Boolean, default: false }
    }
  ],
  channels: [{
    _id: { type: Schema.Types.ObjectId, ref: "Channel" }, // Corrected reference to "Channel"
    name: { type: String }
  }],
  connectedChannels: [
    { type: Schema.Types.ObjectId, ref: "Channel" } // Corrected reference to "Channel"
  ],
  receivedChannelRequest: [ // Corrected spelling
    { type: Schema.Types.ObjectId, ref: "Channel" } // Corrected reference to "Channel"
  ],
  blockChannels: [
    { type: Schema.Types.ObjectId, ref: "Channel" } // Corrected reference to "Channel"
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