import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import PrivateChat from '@/components/Chat/PrivateChat';
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  MessageSquare, 
  UserPlus,
  Clock,
  Circle,
  Minus,
  XCircle
} from 'lucide-react';

const BuddyList: React.FC = () => {
  const { user } = useAuth();
  const { onlineUsers, sendPrivateMessage } = useSocket();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['online', 'away', 'busy'])
  );
  const [privateChatWith, setPrivateChatWith] = useState<any>(null);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const categorizeUsers = () => {
    const filteredUsers = onlineUsers.filter(u => u.id !== user?.id);
    
    return {
      online: filteredUsers.filter(u => u.status === 'online'),
      away: filteredUsers.filter(u => u.status === 'away'),
      busy: filteredUsers.filter(u => u.status === 'busy'),
      offline: filteredUsers.filter(u => u.status === 'offline')
    };
  };

  const { online, away, busy, offline } = categorizeUsers();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <div className="status-online" />;
      case 'away':
        return <div className="status-away" />;
      case 'busy':
        return <div className="status-busy" />;
      case 'offline':
        return <div className="status-offline" />;
      default:
        return <div className="status-offline" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-status-online';
      case 'away':
        return 'text-status-away';
      case 'busy':
        return 'text-status-busy';
      case 'offline':
        return 'text-status-offline';
      default:
        return 'text-status-offline';
    }
  };

  const UserItem: React.FC<{ user: any }> = ({ user: buddyUser }) => (
    <div 
      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => setPrivateChatWith(buddyUser)}
    >
      <div className="relative">
        <Avatar className="w-8 h-8">
          <AvatarImage src={buddyUser.avatar} />
          <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
            {buddyUser.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1">
          {getStatusIcon(buddyUser.status)}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{buddyUser.username}</p>
        <p className={`text-xs ${getStatusColor(buddyUser.status)} capitalize`}>
          {buddyUser.status}
        </p>
      </div>
      
      {buddyUser.status !== 'offline' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setPrivateChatWith(buddyUser);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const CategorySection: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    category: string; 
    users: any[];
    count?: number;
  }> = ({ title, icon, category, users, count }) => (
    <Collapsible 
      open={expandedCategories.has(category)} 
      onOpenChange={() => toggleCategory(category)}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-sm font-medium mb-2 group">
          {expandedCategories.has(category) ? 
            <ChevronDown className="h-4 w-4 mr-2" /> : 
            <ChevronRight className="h-4 w-4 mr-2" />
          }
          {icon}
          <span className="ml-2">{title}</span>
          <span className="ml-auto text-xs">{count || users.length}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {users.map(buddyUser => (
          <div key={buddyUser.id} className="group">
            <UserItem user={buddyUser} />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <>
      <Card className="w-80 lg:w-80 md:w-72 sm:w-64 shadow-buddy">
        <CardHeader className="gradient-yahoo text-white">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Buddy List
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="h-96 yahoo-scrollbar">
            <div className="space-y-2">
              {online.length > 0 && (
                <CategorySection
                  title="Online"
                  icon={<Circle className="h-4 w-4 text-status-online fill-current" />}
                  category="online"
                  users={online}
                />
              )}

              {away.length > 0 && (
                <CategorySection
                  title="Away"
                  icon={<Clock className="h-4 w-4 text-status-away" />}
                  category="away"
                  users={away}
                />
              )}

              {busy.length > 0 && (
                <CategorySection
                  title="Busy"
                  icon={<Minus className="h-4 w-4 text-status-busy" />}
                  category="busy"
                  users={busy}
                />
              )}

              {offline.length > 0 && (
                <CategorySection
                  title="Offline"
                  icon={<XCircle className="h-4 w-4 text-status-offline" />}
                  category="offline"
                  users={offline}
                />
              )}

              {online.length === 0 && away.length === 0 && busy.length === 0 && offline.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No buddies online</p>
                  <p className="text-xs">Add friends to see them here</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {privateChatWith && (
        <PrivateChat 
          recipient={privateChatWith} 
          onClose={() => setPrivateChatWith(null)} 
        />
      )}
    </>
  );
};

export default BuddyList;