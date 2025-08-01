import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '@/contexts/SocketContext';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const formatTime = (timestamp: Date) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  if (message.message_type === 'system') {
    return (
      <div className="chat-bubble-system">
        <p className="text-xs">{message.content}</p>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {!isOwnMessage && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={message.sender?.avatar_url || ''} />
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {(message.sender?.display_name || message.sender?.username || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-xs`}>
        {!isOwnMessage && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {message.sender?.display_name || message.sender?.username}
          </span>
        )}
        
        <div className={isOwnMessage ? 'chat-bubble-sent' : 'chat-bubble-received'}>
          <p className="text-sm break-words">{message.content}</p>
        </div>
        
        <span className="text-xs text-muted-foreground mt-1 px-1">
          {formatTime(new Date(message.created_at))}
          {isOwnMessage && !message.is_read && (
            <span className="ml-1 text-primary">•</span>
          )}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;