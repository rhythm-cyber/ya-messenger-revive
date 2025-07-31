const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Room = require('../models/Room');
const { INDIAN_STATES, INDIAN_LANGUAGES, MAIN_ROOMS } = require('../utils/constants');

// Initialize default rooms
const initializeDefaultRooms = async () => {
  try {
    // Create main rooms
    for (const roomName of MAIN_ROOMS) {
      const existingRoom = await Room.findOne({ name: roomName });
      if (!existingRoom) {
        const room = new Room({
          name: roomName,
          type: 'public',
          category: 'main',
          creator: null, // System created
          description: `Welcome to ${roomName} chat room!`
        });
        await room.save();
        console.log(`Created main room: ${roomName}`);
      }
    }

    // Create state rooms
    for (const stateName of INDIAN_STATES) {
      const existingRoom = await Room.findOne({ name: stateName });
      if (!existingRoom) {
        const room = new Room({
          name: stateName,
          type: 'state',
          category: 'states',
          creator: null,
          description: `Connect with people from ${stateName}`
        });
        await room.save();
        console.log(`Created state room: ${stateName}`);
      }
    }

    // Create language rooms
    for (const language of INDIAN_LANGUAGES) {
      const roomName = `${language} Chat`;
      const existingRoom = await Room.findOne({ name: roomName });
      if (!existingRoom) {
        const room = new Room({
          name: roomName,
          type: 'language',
          category: 'languages',
          creator: null,
          description: `Chat in ${language} language`
        });
        await room.save();
        console.log(`Created language room: ${roomName}`);
      }
    }
  } catch (error) {
    console.error('Error initializing default rooms:', error);
  }
};

const setupSocketHandlers = (io) => {
  // Initialize default rooms on startup
  initializeDefaultRooms();

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.username} connected`);

    try {
      // Update user online status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        status: 'online',
        socketId: socket.id
      });

      // Join user to their personal room
      socket.join(socket.userId);

      // Get all rooms and online users
      const rooms = await Room.find({ isActive: true })
        .select('name type category participants')
        .lean();

      const onlineUsers = await User.find({ isOnline: true })
        .select('username avatar status lastSeen')
        .lean();

      // Send initial data
      socket.emit('rooms_list', rooms.map(room => ({
        ...room,
        id: room._id,
        participantCount: room.participants.length
      })));

      socket.emit('users_list', onlineUsers.map(user => ({
        ...user,
        id: user._id
      })));

      // Broadcast user online status
      socket.broadcast.emit('user_online', {
        id: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
        status: socket.user.status
      });

      // Handle joining rooms
      socket.on('join_room', async (roomId) => {
        try {
          const room = await Room.findById(roomId);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          // Add user to room participants
          await room.addParticipant(socket.userId);
          await room.updateParticipantStatus(socket.userId, true);

          // Join socket room
          socket.join(roomId);

          // Get recent messages
          const messages = await Message.find({ room: roomId })
            .populate('sender', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

          // Send room data and messages
          socket.emit('room_joined', {
            ...room.toObject(),
            id: room._id,
            participantCount: room.participants.length
          });

          socket.emit('message_history', messages.reverse().map(msg => ({
            id: msg._id,
            content: msg.content,
            senderId: msg.sender._id,
            senderUsername: msg.sender.username,
            senderAvatar: msg.sender.avatar,
            roomId: msg.room,
            timestamp: msg.createdAt,
            type: msg.type,
            isRead: msg.isRead
          })));

          // Notify other users
          socket.to(roomId).emit('user_joined_room', {
            user: {
              id: socket.userId,
              username: socket.user.username,
              avatar: socket.user.avatar,
              status: socket.user.status
            },
            room: {
              ...room.toObject(),
              id: room._id,
              participantCount: room.participants.length
            }
          });

        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Handle leaving rooms
      socket.on('leave_room', async (roomId) => {
        try {
          const room = await Room.findById(roomId);
          if (room) {
            await room.removeParticipant(socket.userId);
            socket.leave(roomId);
            
            socket.emit('room_left', roomId);
            socket.to(roomId).emit('user_left_room', {
              userId: socket.userId,
              room: {
                ...room.toObject(),
                id: room._id,
                participantCount: room.participants.length - 1
              }
            });
          }
        } catch (error) {
          console.error('Error leaving room:', error);
        }
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const { content, roomId, receiverId, type = 'text' } = data;

          if (!content || content.trim().length === 0) {
            return;
          }

          const messageData = {
            content: content.trim(),
            sender: socket.userId,
            type
          };

          if (roomId) {
            // Room message
            messageData.room = roomId;
            
            const room = await Room.findById(roomId);
            if (!room || !room.isParticipant(socket.userId)) {
              socket.emit('error', { message: 'Not authorized to send message' });
              return;
            }

            const message = new Message(messageData);
            await message.save();
            await message.populate('sender', 'username avatar');
            await room.updateActivity();
            await room.incrementMessageCount();

            const messagePayload = {
              id: message._id,
              content: message.content,
              senderId: message.sender._id,
              senderUsername: message.sender.username,
              senderAvatar: message.sender.avatar,
              roomId: message.room,
              timestamp: message.createdAt,
              type: message.type,
              isRead: false
            };

            io.to(roomId).emit('new_message', messagePayload);

          } else if (receiverId) {
            // Private message
            messageData.receiver = receiverId;
            
            const receiver = await User.findById(receiverId);
            if (!receiver) {
              socket.emit('error', { message: 'Recipient not found' });
              return;
            }

            const message = new Message(messageData);
            await message.save();
            await message.populate('sender', 'username avatar');

            const messagePayload = {
              id: message._id,
              content: message.content,
              senderId: message.sender._id,
              senderUsername: message.sender.username,
              senderAvatar: message.sender.avatar,
              receiverId: message.receiver,
              timestamp: message.createdAt,
              type: message.type,
              isRead: false
            };

            // Send to both sender and receiver
            socket.emit('new_message', messagePayload);
            socket.to(receiverId).emit('new_message', messagePayload);
          }

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('start_typing', (data) => {
        const { roomId, receiverId } = data;
        const payload = {
          userId: socket.userId,
          username: socket.user.username,
          roomId,
          receiverId
        };

        if (roomId) {
          socket.to(roomId).emit('user_typing', payload);
        } else if (receiverId) {
          socket.to(receiverId).emit('user_typing', payload);
        }
      });

      socket.on('stop_typing', (data) => {
        const { roomId, receiverId } = data;
        const payload = {
          userId: socket.userId,
          username: socket.user.username,
          roomId,
          receiverId
        };

        if (roomId) {
          socket.to(roomId).emit('user_stopped_typing', payload);
        } else if (receiverId) {
          socket.to(receiverId).emit('user_stopped_typing', payload);
        }
      });

      // Handle marking messages as read
      socket.on('mark_as_read', async (messageId) => {
        try {
          const message = await Message.findById(messageId);
          if (message) {
            await message.markAsRead(socket.userId);
          }
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`User ${socket.user.username} disconnected`);
        
        try {
          // Update user offline status
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            status: 'offline',
            socketId: null,
            lastSeen: new Date()
          });

          // Update room participant status
          const rooms = await Room.find({
            'participants.user': socket.userId
          });

          for (const room of rooms) {
            await room.updateParticipantStatus(socket.userId, false);
          }

          // Broadcast user offline
          socket.broadcast.emit('user_offline', socket.userId);

        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });

    } catch (error) {
      console.error('Error in socket connection:', error);
      socket.disconnect();
    }
  });
};

module.exports = setupSocketHandlers;