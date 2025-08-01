import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id?: string;
  room_id?: string;
  message_type: 'text' | 'emoji' | 'image' | 'file' | 'system';
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  category: 'general' | 'state' | 'language' | 'interest';
  avatar_url?: string;
  max_members: number;
  is_active: boolean;
  created_at: string;
  member_count?: number;
}

export interface OnlineUser {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'busy' | 'invisible' | 'offline';
  last_seen?: string;
}

interface SocketContextType {
  onlineUsers: OnlineUser[];
  messages: Message[];
  rooms: Room[];
  currentRoom: Room | null;
  typingUsers: { [key: string]: string[] };
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (content: string, roomId?: string, receiverId?: string) => void;
  sendPrivateMessage: (content: string, receiverId: string) => void;
  markAsRead: (messageId: string) => void;
  startTyping: (roomId?: string, receiverId?: string) => void;
  stopTyping: (roomId?: string, receiverId?: string) => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, session } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string[] }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [presenceChannel, setPresenceChannel] = useState<RealtimeChannel | null>(null);

  // Initialize realtime subscriptions
  useEffect(() => {
    if (user && session) {
      setIsConnected(true);
      
      // Subscribe to rooms changes
      const roomsChannel = supabase
        .channel('rooms-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rooms'
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newRoom = payload.new as any;
              setRooms(prev => [...prev, {
                ...newRoom,
                type: newRoom.type as 'public' | 'private',
                category: newRoom.category as 'general' | 'state' | 'language' | 'interest'
              }]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedRoom = payload.new as any;
              setRooms(prev => prev.map(room => 
                room.id === updatedRoom.id ? {
                  ...updatedRoom,
                  type: updatedRoom.type as 'public' | 'private',
                  category: updatedRoom.category as 'general' | 'state' | 'language' | 'interest'
                } : room
              ));
            } else if (payload.eventType === 'DELETE') {
              setRooms(prev => prev.filter(room => room.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Subscribe to messages changes
      const messagesChannel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            const rawMessage = payload.new as any;
            const newMessage: Message = {
              ...rawMessage,
              message_type: rawMessage.message_type as 'text' | 'emoji' | 'image' | 'file' | 'system'
            };
            
            // Fetch sender details
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single();

            const messageWithSender = {
              ...newMessage,
              sender: senderData
            };

            setMessages(prev => [...prev, messageWithSender]);
            
            // Play notification sound if message is not from current user
            if (newMessage.sender_id !== user?.id) {
              playNotificationSound();
              toast(`New message from ${senderData?.display_name || senderData?.username}`, { icon: '💬' });
            }
          }
        )
        .subscribe();

      // Set up presence tracking
      const presence = supabase.channel('online-users');
      
      presence
        .on('presence', { event: 'sync' }, () => {
          const state = presence.presenceState();
          const users: OnlineUser[] = [];
          
          Object.keys(state).forEach(key => {
            const presences = state[key] as any[];
            presences.forEach(presence => {
              if (presence.user_id !== user.id) {
                users.push({
                  id: presence.user_id,
                  username: presence.username,
                  display_name: presence.display_name,
                  avatar_url: presence.avatar_url,
                  status: presence.status || 'online',
                  last_seen: presence.last_seen
                });
              }
            });
          });
          
          setOnlineUsers(users);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          const newUsers = newPresences.map((presence: any) => ({
            id: presence.user_id,
            username: presence.username,
            display_name: presence.display_name,
            avatar_url: presence.avatar_url,
            status: presence.status || 'online',
            last_seen: presence.last_seen
          }));
          
          newUsers.forEach(user => {
            if (user.id !== user.id) {
              toast(`${user.display_name || user.username} came online`, { icon: '💚' });
            }
          });
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && profile) {
            await presence.track({
              user_id: user.id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              status: profile.status,
              last_seen: new Date().toISOString()
            });
          }
        });

      setPresenceChannel(presence);

      // Load initial data
      loadRooms();
      
      return () => {
        roomsChannel.unsubscribe();
        messagesChannel.unsubscribe();
        presence.unsubscribe();
        setIsConnected(false);
      };
    }
  }, [user, session, profile]);

  const loadRooms = async () => {
    const { data: roomsData, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading rooms:', error);
    } else {
      const typedRooms: Room[] = (roomsData || []).map(room => ({
        ...room,
        type: room.type as 'public' | 'private',
        category: room.category as 'general' | 'state' | 'language' | 'interest'
      }));
      setRooms(typedRooms);
    }
  };

  const loadMessages = async (roomId?: string, receiverId?: string) => {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)
      `)
      .order('created_at', { ascending: true });

    if (roomId) {
      query = query.eq('room_id', roomId);
    } else if (receiverId) {
      query = query.or(`and(sender_id.eq.${user?.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user?.id})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      const typedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        message_type: msg.message_type as 'text' | 'emoji' | 'image' | 'file' | 'system'
      }));
      setMessages(typedMessages);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user?.id) return;

    // Add user to room_members if not already a member
    const { error: memberError } = await supabase
      .from('room_members')
      .upsert({
        room_id: roomId,
        user_id: user.id,
        is_online: true,
        last_seen: new Date().toISOString()
      });

    if (memberError) {
      console.error('Error joining room:', memberError);
      return;
    }

    // Get room details
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError) {
      console.error('Error fetching room:', roomError);
      return;
    }

    setCurrentRoom({
      ...roomData,
      type: roomData.type as 'public' | 'private',
      category: roomData.category as 'general' | 'state' | 'language' | 'interest'
    });
    loadMessages(roomId);
    toast.success(`Joined ${roomData.name}`);
  };

  const leaveRoom = async (roomId: string) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving room:', error);
      return;
    }

    if (currentRoom?.id === roomId) {
      setCurrentRoom(null);
      setMessages([]);
    }
  };

  const sendMessage = async (content: string, roomId?: string, receiverId?: string) => {
    if (!user?.id || !content.trim()) return;

    const messageData = {
      content: content.trim(),
      sender_id: user.id,
      room_id: roomId || null,
      receiver_id: receiverId || null,
      message_type: 'text' as const,
      is_read: false
    };

    const { error } = await supabase
      .from('messages')
      .insert([messageData]);

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const sendPrivateMessage = (content: string, receiverId: string) => {
    sendMessage(content, undefined, receiverId);
  };

  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const startTyping = (roomId?: string, receiverId?: string) => {
    // TODO: Implement typing indicators with Supabase presence
  };

  const stopTyping = (roomId?: string, receiverId?: string) => {
    // TODO: Implement typing indicators with Supabase presence
  };

  return (
    <SocketContext.Provider
      value={{
        onlineUsers,
        messages,
        rooms,
        currentRoom,
        typingUsers,
        joinRoom,
        leaveRoom,
        sendMessage,
        sendPrivateMessage,
        markAsRead,
        startTyping,
        stopTyping,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};