const mongoose = require('mongoose');
const { Schema } = mongoose;

const pollOptionSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true
  },
  title: {
    type: String,
    required: true
  },
  votes: {
    type: Number,
    default: 0
  },
  voters: {
    type: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  }
});

const channelPollSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  ChannelId: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  voters: [{
    type: Schema.Types.ObjectId,
    ref: 'Users'

  }],
  options: {
    type: [pollOptionSchema],
    required: true,
    validate: {
      validator: function (v) {
        return v.length > 0;
      },
      message: 'Poll must have at least one option'
    }
  },
  allowMultipleChoices: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  }
}, {
  timestamps: false // Disable automatic createdAt and updatedAt since we have our own createdAt
});

// Create compound index for better query performance
channelPollSchema.index({ chatMessageId: 1, isDeleted: 1 });
channelPollSchema.index({ createdBy: 1, status: 1 });

module.exports = mongoose.model('ChannelPool', channelPollSchema);