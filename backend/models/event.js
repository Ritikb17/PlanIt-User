const mongoose = require('mongoose');
const { Schema } = mongoose;

const event = new Schema({
    name: { type: String, require: true },
    description: { type: String },
    isPrivate: { type: Boolean, require: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    sendRequest: [{ type: Schema.Types.ObjectId, ref: "User"}],
    eventDate:{type:Date,require:true},
    recivedRequest: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: [{
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

const Event = mongoose.model('Event', event);
module.exports = Event;