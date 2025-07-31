import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  receiverId?: string;
  roomId?: string;
  timestamp: Date;
  type: 'text' | 'system' | 'emoji';
  isRead: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: 'public' | 'private' | 'state' | 'language';
  category?: string;
  participants: string[];
  participantCount: number;
  lastMessage?: Message;
}

export interface OnlineUser {
  id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
}

interface SocketContextType {
  socket: Socket | null;
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

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string[] }>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user && token) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token,
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        toast.success('Connected to Yahoo Messenger');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
        toast.error('Disconnected from server');
      });

      // User events
      newSocket.on('user_online', (user: OnlineUser) => {
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.id !== user.id);
          return [...filtered, user];
        });
        toast(`${user.username} came online`, { icon: '💚' });
      });

      newSocket.on('user_offline', (userId: string) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== userId));
      });

      newSocket.on('users_list', (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      // Message events
      newSocket.on('new_message', (message: Message) => {
        setMessages(prev => [...prev, message]);
        
        // Play notification sound if message is not from current user
        if (message.senderId !== user.id) {
          playNotificationSound();
          toast(`New message from ${message.senderUsername}`, { icon: '💬' });
        }
      });

      newSocket.on('message_history', (messageHistory: Message[]) => {
        setMessages(messageHistory);
      });

      // Room events
      newSocket.on('rooms_list', (roomsList: Room[]) => {
        setRooms(roomsList);
      });

      newSocket.on('room_joined', (room: Room) => {
        setCurrentRoom(room);
        toast.success(`Joined ${room.name}`);
      });

      newSocket.on('room_left', (roomId: string) => {
        if (currentRoom?.id === roomId) {
          setCurrentRoom(null);
        }
      });

      newSocket.on('user_joined_room', ({ user: joinedUser, room }: { user: OnlineUser, room: Room }) => {
        setRooms(prev => prev.map(r => r.id === room.id ? room : r));
        if (currentRoom?.id === room.id) {
          setCurrentRoom(room);
        }
        toast(`${joinedUser.username} joined ${room.name}`, { icon: '👋' });
      });

      newSocket.on('user_left_room', ({ userId, room }: { userId: string, room: Room }) => {
        setRooms(prev => prev.map(r => r.id === room.id ? room : r));
        if (currentRoom?.id === room.id) {
          setCurrentRoom(room);
        }
      });

      // Typing events
      newSocket.on('user_typing', ({ userId, username, roomId, receiverId }: { userId: string, username: string, roomId?: string, receiverId?: string }) => {
        const key = roomId || receiverId || 'general';
        setTypingUsers(prev => ({
          ...prev,
          [key]: [...(prev[key] || []).filter(u => u !== username), username]
        }));
      });

      newSocket.on('user_stopped_typing', ({ userId, username, roomId, receiverId }: { userId: string, username: string, roomId?: string, receiverId?: string }) => {
        const key = roomId || receiverId || 'general';
        setTypingUsers(prev => ({
          ...prev,
          [key]: (prev[key] || []).filter(u => u !== username)
        }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  const joinRoom = (roomId: string) => {
    socket?.emit('join_room', roomId);
  };

  const leaveRoom = (roomId: string) => {
    socket?.emit('leave_room', roomId);
  };

  const sendMessage = (content: string, roomId?: string, receiverId?: string) => {
    if (!socket || !user) return;

    const messageData = {
      content,
      roomId,
      receiverId,
      type: 'text'
    };

    socket.emit('send_message', messageData);
  };

  const sendPrivateMessage = (content: string, receiverId: string) => {
    sendMessage(content, undefined, receiverId);
  };

  const markAsRead = (messageId: string) => {
    socket?.emit('mark_as_read', messageId);
  };

  const startTyping = (roomId?: string, receiverId?: string) => {
    socket?.emit('start_typing', { roomId, receiverId });
  };

  const stopTyping = (roomId?: string, receiverId?: string) => {
    socket?.emit('stop_typing', { roomId, receiverId });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
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