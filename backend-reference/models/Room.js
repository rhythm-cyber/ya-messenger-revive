const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200,
    default: ''
  },
  type: {
    type: String,
    enum: ['public', 'private', 'state', 'language'],
    default: 'public'
  },
  category: {
    type: String,
    enum: ['main', 'states', 'languages', 'custom'],
    default: 'custom'
  },
  avatar: {
    type: String,
    default: null
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    isOnline: {
      type: Boolean,
      default: false
    }
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxParticipants: {
      type: Number,
      default: 1000
    },
    allowFileUpload: {
      type: Boolean,
      default: true
    },
    allowEmojis: {
      type: Boolean,
      default: true
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ type: 1, category: 1 });
roomSchema.index({ name: 1 });
roomSchema.index({ 'participants.user': 1 });

// Virtual for participant count
roomSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual for online participant count
roomSchema.virtual('onlineParticipantCount').get(function() {
  return this.participants.filter(p => p.isOnline).length;
});

// Add participant method
roomSchema.methods.addParticipant = function(userId, role = 'member') {
  const existingParticipant = this.participants.find(p => p.user.equals(userId));
  if (!existingParticipant) {
    this.participants.push({ user: userId, role });
    return this.save();
  }
  return Promise.resolve(this);
};

// Remove participant method
roomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => !p.user.equals(userId));
  return this.save();
};

// Update participant online status
roomSchema.methods.updateParticipantStatus = function(userId, isOnline) {
  const participant = this.participants.find(p => p.user.equals(userId));
  if (participant) {
    participant.isOnline = isOnline;
    return this.save();
  }
  return Promise.resolve(this);
};

// Check if user is participant
roomSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.user.equals(userId));
};

// Check if user is admin
roomSchema.methods.isAdmin = function(userId) {
  return this.admins.includes(userId) || this.creator.equals(userId);
};

// Check if user is moderator
roomSchema.methods.isModerator = function(userId) {
  return this.moderators.includes(userId) || this.isAdmin(userId);
};

// Update last activity
roomSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Increment message count
roomSchema.methods.incrementMessageCount = function() {
  this.messageCount += 1;
  return this.save();
};

module.exports = mongoose.model('Room', roomSchema);