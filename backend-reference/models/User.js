const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: {
    sent: [{
      to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      sentAt: {
        type: Date,
        default: Date.now
      }
    }],
    received: [{
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      receivedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  joinedRooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  socketId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Add friend method
userSchema.methods.addFriend = async function(friendId) {
  if (!this.friends.includes(friendId)) {
    this.friends.push(friendId);
    await this.save();
  }
};

// Remove friend method
userSchema.methods.removeFriend = async function(friendId) {
  this.friends = this.friends.filter(friend => !friend.equals(friendId));
  await this.save();
};

// Send friend request
userSchema.methods.sendFriendRequest = async function(toUserId) {
  const existingRequest = this.friendRequests.sent.find(req => req.to.equals(toUserId));
  if (!existingRequest && !this.friends.includes(toUserId)) {
    this.friendRequests.sent.push({ to: toUserId });
    await this.save();
    
    // Add to recipient's received requests
    const recipient = await this.constructor.findById(toUserId);
    if (recipient) {
      recipient.friendRequests.received.push({ from: this._id });
      await recipient.save();
    }
  }
};

// Accept friend request
userSchema.methods.acceptFriendRequest = async function(fromUserId) {
  // Remove from received requests
  this.friendRequests.received = this.friendRequests.received.filter(
    req => !req.from.equals(fromUserId)
  );
  
  // Add to friends
  await this.addFriend(fromUserId);
  await this.save();
  
  // Remove from sender's sent requests and add to their friends
  const sender = await this.constructor.findById(fromUserId);
  if (sender) {
    sender.friendRequests.sent = sender.friendRequests.sent.filter(
      req => !req.to.equals(this._id)
    );
    await sender.addFriend(this._id);
  }
};

module.exports = mongoose.model('User', userSchema);