import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSocket } from '@/contexts/SocketContext';
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
      states: rooms.filter(room => room.type === 'state'),
      languages: rooms.filter(room => room.type === 'language'),
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
          <span className="text-xs ml-2">{room.participantCount}</span>
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
    <Card className="w-80 shadow-buddy">
      <CardHeader className="gradient-yahoo text-white">
        <CardTitle className="text-lg flex items-center">
          <Hash className="h-5 w-5 mr-2" />
          Chat Rooms
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-96 yahoo-scrollbar">
          <div className="space-y-2">
            {main.length > 0 && (
              <CategorySection
                title="Main Rooms"
                icon={<Globe className="h-4 w-4" />}
                category="main"
                rooms={main}
              />
            )}

            {states.length > 0 && (
              <CategorySection
                title="Indian States"
                icon={<MapPin className="h-4 w-4" />}
                category="states"
                rooms={states}
              />
            )}

            {languages.length > 0 && (
              <CategorySection
                title="Language Rooms"
                icon={<Languages className="h-4 w-4" />}
                category="languages"
                rooms={languages}
              />
            )}

            {custom.length > 0 && (
              <CategorySection
                title="Custom Rooms"
                icon={<Hash className="h-4 w-4" />}
                category="custom"
                rooms={custom}
              />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RoomList;