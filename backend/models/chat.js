const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  members:[{type: Schema.Types.ObjectId, ref: 'User'}],
  messages: [{
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false } 
}]


});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
