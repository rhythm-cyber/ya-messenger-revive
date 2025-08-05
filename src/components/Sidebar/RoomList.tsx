import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSocket } from '@/contexts/SocketContext';
import CreateRoomDialog from '@/components/Chat/CreateRoomDialog';
import { ChevronDown, ChevronRight, Hash, Globe, MapPin, Languages } from 'lucide-react';

const RoomList: React.FC = () => {
  const { rooms, currentRoom, joinRoom, leaveRoom } = useSocket();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['main', 'india', 'languages'])
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const categorizeRooms = () => {
    const categories = {
      main: rooms.filter(room => room.type === 'public' && ['Main Lobby', 'India', 'Global'].includes(room.name)),
      states: rooms.filter(room => room.category === 'state'),
      languages: rooms.filter(room => room.category === 'language'),
      custom: rooms.filter(room => room.type === 'private' || 
        (room.type === 'public' && !['Main Lobby', 'India', 'Global'].includes(room.name)))
    };
    return categories;
  };

  const { main, states, languages, custom } = categorizeRooms();

  const RoomItem: React.FC<{ room: any }> = ({ room }) => (
    <Button
      variant={currentRoom?.id === room.id ? "default" : "ghost"}
      className={`w-full justify-start text-left mb-1 ${
        currentRoom?.id === room.id ? 'bg-primary text-primary-foreground' : ''
      }`}
      onClick={() => {
        if (currentRoom?.id === room.id) {
          leaveRoom(room.id);
        } else {
          joinRoom(room.id);
        }
      }}
    >
      <Hash className="h-4 w-4 mr-2" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="truncate">{room.name}</span>
          <span className="text-xs ml-2">{room.member_count || 0}</span>
        </div>
      </div>
    </Button>
  );

  const CategorySection: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    category: string; 
    rooms: any[] 
  }> = ({ title, icon, category, rooms }) => (
    <Collapsible 
      open={expandedCategories.has(category)} 
      onOpenChange={() => toggleCategory(category)}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-sm font-medium mb-2">
          {expandedCategories.has(category) ? 
            <ChevronDown className="h-4 w-4 mr-2" /> : 
            <ChevronRight className="h-4 w-4 mr-2" />
          }
          {icon}
          <span className="ml-2">{title}</span>
          <span className="ml-auto text-xs">{rooms.length}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 ml-4">
        {rooms.map(room => (
          <RoomItem key={room.id} room={room} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="w-80 shadow-buddy window-chrome">
      {/* Title bar */}
      <div className="bg-gray-300 border-b border-gray-500 px-2 py-1 flex items-center justify-between">
        <span className="text-xs font-bold">Chat Rooms</span>
        <CreateRoomDialog />
      </div>
      
      <div className="window-inset m-1 flex-1">
        <ScrollArea className="h-96 yahoo-scrollbar bg-white">
          <div className="p-2">
            {main.length > 0 && (
              <div className="mb-2">
                <div className="bg-gray-200 px-2 py-1 border-b border-gray-400">
                  <span className="text-xs font-bold">Main Rooms</span>
                </div>
                {main.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => {
                      if (currentRoom?.id === room.id) {
                        leaveRoom(room.id);
                      } else {
                        joinRoom(room.id);
                      }
                    }}
                    className={`p-2 cursor-pointer border-b border-gray-200 hover:bg-blue-100 ${
                      currentRoom?.id === room.id ? 'bg-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 text-blue-600">#</div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-blue-600">{room.name}</div>
                        <div className="text-xs text-gray-600">
                          {room.member_count || 0} users
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {custom.length > 0 && (
              <div className="mb-2">
                <div className="bg-gray-200 px-2 py-1 border-b border-gray-400">
                  <span className="text-xs font-bold">Custom Rooms</span>
                </div>
                {custom.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => {
                      if (currentRoom?.id === room.id) {
                        leaveRoom(room.id);
                      } else {
                        joinRoom(room.id);
                      }
                    }}
                    className={`p-2 cursor-pointer border-b border-gray-200 hover:bg-blue-100 ${
                      currentRoom?.id === room.id ? 'bg-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 text-blue-600">#</div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-blue-600">{room.name}</div>
                        <div className="text-xs text-gray-600">
                          {room.member_count || 0} users
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default RoomList;