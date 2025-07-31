const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for room messages
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null // null for private messages
  },
  type: {
    type: String,
    enum: ['text', 'emoji', 'system', 'file', 'image'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

// Mark message as read
messageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.user.equals(userId))) {
    this.readBy.push({ user: userId });
    this.isRead = true;
  }
  return this.save();
};

// Edit message
messageSchema.methods.editContent = function(newContent) {
  this.content = newContent;
  this.editedAt = new Date();
  return this.save();
};

// Soft delete message
messageSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Check if message is private
messageSchema.virtual('isPrivate').get(function() {
  return !!this.receiver;
});

// Check if message is in room
messageSchema.virtual('isRoomMessage').get(function() {
  return !!this.room;
});

module.exports = mongoose.model('Message', messageSchema);