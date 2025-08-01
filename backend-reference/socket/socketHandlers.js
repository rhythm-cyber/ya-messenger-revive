const { supabase } = require('../supabaseClient');

async function initializeDefaultRooms() {
  const { data: generalRoom, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('name', 'General')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error checking default room:', error.message);
    return;
  }

  if (!generalRoom) {
    const { error: insertError } = await supabase.from('rooms').insert([
      {
        name: 'General',
        description: 'Default public room',
        type: 'public',
        category: 'main',
        creator: 'system', // Replace with actual user ID if available
      },
    ]);

    if (insertError) {
      console.error('❌ Failed to create default room:', insertError.message);
    } else {
      console.log('✅ Created default room: "General"');
    }
  } else {
    console.log('ℹ️ Default room "General" already exists');
  }
}

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on('joinRoom', async ({ roomName, userId }) => {
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('name', roomName)
        .single();

      if (error || !room) {
        console.error('❌ Room not found:', error?.message);
        return socket.emit('error', 'Room not found');
      }

      socket.join(roomName);
      console.log(`👤 User ${userId} joined room: ${roomName}`);

      // Optionally notify others
      socket.to(roomName).emit('userJoined', { userId });
    });

    socket.on('sendMessage', async ({ roomName, userId, content }) => {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('name', roomName)
        .single();

      if (roomError || !room) {
        console.error('❌ Failed to find room:', roomError?.message);
        return;
      }

      const { error: messageError } = await supabase.from('messages').insert([
        {
          room_id: room.id,
          sender_id: userId,
          content,
        },
      ]);

      if (messageError) {
        console.error('❌ Failed to send message:', messageError.message);
        return;
      }

      io.to(roomName).emit('newMessage', {
        room: roomName,
        sender: userId,
        content,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  // Initialize default rooms
  initializeDefaultRooms().catch((err) =>
    console.error('❌ Error initializing rooms:', err)
  );
}

module.exports = setupSocketHandlers;
