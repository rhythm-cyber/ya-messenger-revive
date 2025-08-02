import React from 'react';
import YahooHeader from '@/components/Header/YahooHeader';
import RoomList from '@/components/Sidebar/RoomList';
import BuddyList from '@/components/Sidebar/BuddyList';
import ChatInterface from '@/components/Chat/ChatInterface';

const MainLayout: React.FC = () => {
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
                <BuddyList />
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
            <BuddyList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;