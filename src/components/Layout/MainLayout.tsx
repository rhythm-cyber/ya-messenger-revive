import React, { useState, useEffect } from 'react';
import YahooHeader from '@/components/Header/YahooHeader';
import RoomList from '@/components/Sidebar/RoomList';
import BuddyList from '@/components/Sidebar/BuddyList';
import ChatInterface from '@/components/Chat/ChatInterface';
import PrivateChat from '@/components/Chat/PrivateChat';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const { messages } = useSocket();
  const [activePrivateChats, setActivePrivateChats] = useState<Set<string>>(new Set());
  const [privateRecipients, setPrivateRecipients] = useState<Map<string, any>>(new Map());

  // Auto-open private chat when receiving new private message
  useEffect(() => {
    const privateMessages = messages.filter(msg => 
      msg.receiver_id === user?.id && msg.sender_id !== user?.id
    );
    
    if (privateMessages.length > 0) {
      const latestMessage = privateMessages[privateMessages.length - 1];
      if (latestMessage.sender && !activePrivateChats.has(latestMessage.sender_id)) {
        setActivePrivateChats(prev => new Set([...prev, latestMessage.sender_id]));
        setPrivateRecipients(prev => new Map([...prev, [latestMessage.sender_id, latestMessage.sender]]));
      }
    }
  }, [messages, user?.id, activePrivateChats]);

  const handleOpenPrivateChat = (recipient: any) => {
    setActivePrivateChats(prev => new Set([...prev, recipient.id]));
    setPrivateRecipients(prev => new Map([...prev, [recipient.id, recipient]]));
  };

  const handleClosePrivateChat = (recipientId: string) => {
    setActivePrivateChats(prev => {
      const newSet = new Set(prev);
      newSet.delete(recipientId);
      return newSet;
    });
    setPrivateRecipients(prev => {
      const newMap = new Map(prev);
      newMap.delete(recipientId);
      return newMap;
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <YahooHeader />
      
      <main className="max-w-screen-2xl mx-auto p-2 h-[calc(100vh-120px)]">
        <div className="flex space-x-2 h-full">
          {/* Left Sidebar - Rooms */}
          <div className="w-48 hidden lg:block">
            <RoomList />
          </div>
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex min-h-0">
              <ChatInterface />
              <div className="w-48 hidden lg:block ml-2">
                <BuddyList onOpenPrivateChat={handleOpenPrivateChat} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Private Chat Windows */}
      {Array.from(activePrivateChats).map(recipientId => {
        const recipient = privateRecipients.get(recipientId);
        return recipient ? (
          <PrivateChat
            key={recipientId}
            recipient={recipient}
            onClose={() => handleClosePrivateChat(recipientId)}
          />
        ) : null;
      })}
    </div>
  );
};

export default MainLayout;