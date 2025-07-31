import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { 
  LogOut, 
  Settings, 
  User, 
  Circle, 
  Clock, 
  Minus, 
  XCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

const YahooHeader: React.FC = () => {
  const { user, logout, updateStatus } = useAuth();
  const { isConnected } = useSocket();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Circle className="h-3 w-3 text-status-online fill-current" />;
      case 'away':
        return <Clock className="h-3 w-3 text-status-away" />;
      case 'busy':
        return <Minus className="h-3 w-3 text-status-busy" />;
      case 'offline':
        return <XCircle className="h-3 w-3 text-status-offline" />;
      default:
        return <XCircle className="h-3 w-3 text-status-offline" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      default:
        return 'Offline';
    }
  };

  const handleStatusChange = (newStatus: 'online' | 'away' | 'busy' | 'offline') => {
    updateStatus(newStatus);
  };

  return (
    <header className="gradient-header border-b p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Yahoo Messenger Logo */}
        <div className="flex items-center space-x-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold">Yahoo! Messenger</h1>
            <p className="text-sm text-white/80">Classic Chat Experience</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-4">
          <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </Badge>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10 space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-white/20 text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{user.username}</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(user.status)}
                      <span className="text-xs">{getStatusText(user.status)}</span>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Status Options */}
                <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleStatusChange('online')}>
                  <Circle className="h-4 w-4 mr-2 text-status-online fill-current" />
                  Online
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('away')}>
                  <Clock className="h-4 w-4 mr-2 text-status-away" />
                  Away
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('busy')}>
                  <Minus className="h-4 w-4 mr-2 text-status-busy" />
                  Busy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('offline')}>
                  <XCircle className="h-4 w-4 mr-2 text-status-offline" />
                  Invisible
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default YahooHeader;