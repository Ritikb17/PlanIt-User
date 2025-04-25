const mongoose = require('mongoose');
const { Schema } = mongoose;

const channel = new Schema({
    name: { type: String, require: true },
    description: { type: String },
    isPrivate: { type: Boolean, require: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    sendRequest: [{ type: Schema.Types.ObjectId, ref: "User"}],
    recivedRequest: [{ type: Schema.Types.ObjectId, ref: "User" }],
    message: [{
        sender: { type: Schema.Types.ObjectId, ref: "User" },
        message: { type: String },
        isRead: { type: Boolean, default: false } ,
        isEdited: { type: Boolean, default: false } ,
        isDeleted: { type: Boolean, default: false } ,
        timestamp: { type: Date, default: Date.now },

    }],
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isDelete: { type: Boolean, default: false } // Added isDelete field
})

const Channel = mongoose.model('Channel', channel);
module.exports = Channel;