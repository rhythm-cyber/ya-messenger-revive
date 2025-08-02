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
    <div className="min-h-screen bg-background">
      <YahooHeader />
      
      <main className="max-w-7xl mx-auto p-2 md:p-4">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 h-[calc(100vh-140px)]">
          {/* Mobile: Combined sidebars */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="w-full">
                <RoomList />
              </div>
              <div className="w-full">
                <BuddyList onOpenPrivateChat={handleOpenPrivateChat} />
              </div>
            </div>
          </div>
          
          {/* Desktop: Left Sidebar - Rooms */}
          <div className="hidden lg:block">
            <RoomList />
          </div>
          
          {/* Main Chat Area */}
          <div className="flex-1 min-h-0">
            <ChatInterface />
          </div>
          
          {/* Desktop: Right Sidebar - Buddy List */}
          <div className="hidden lg:block">
            <BuddyList onOpenPrivateChat={handleOpenPrivateChat} />
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