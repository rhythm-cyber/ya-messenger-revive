import React from 'react';
import YahooHeader from '@/components/Header/YahooHeader';
import RoomList from '@/components/Sidebar/RoomList';
import BuddyList from '@/components/Sidebar/BuddyList';
import ChatInterface from '@/components/Chat/ChatInterface';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <YahooHeader />
      
      <main className="max-w-7xl mx-auto p-4">
        <div className="flex space-x-4 h-[calc(100vh-140px)]">
          {/* Left Sidebar - Rooms */}
          <RoomList />
          
          {/* Main Chat Area */}
          <div className="flex-1">
            <ChatInterface />
          </div>
          
          {/* Right Sidebar - Buddy List */}
          <BuddyList />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;