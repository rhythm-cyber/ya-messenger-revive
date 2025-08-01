// supabase/roomService.js
const { supabase } = require('../supabaseClient');

// Fetch a room by name
async function getRoomByName(name) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('name', name)
    .single();

  if (error) throw error;
  return data;
}

// Create a new room
async function createRoom({ name, description, type = 'public', category = 'custom', avatar = null, creator, settings = {} }) {
  const { data, error } = await supabase
    .from('rooms')
    .insert([{
      name,
      description,
      type,
      category,
      avatar,
      creator,
      settings
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update room activity timestamp
async function updateRoomActivity(roomId) {
  const { error } = await supabase
    .from('rooms')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', roomId);

  if (error) throw error;
}

// Increment message count
async function incrementMessageCount(roomId) {
  const { data, error } = await supabase.rpc('increment_message_count', { room_id: roomId });
  if (error) throw error;
  return data;
}

module.exports = {
  getRoomByName,
  createRoom,
  updateRoomActivity,
  incrementMessageCount
};
