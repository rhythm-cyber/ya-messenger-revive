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
      <div className="text-center mb-2">
        <div className="chat-bubble-system inline-block">
          <p className="text-xs">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
      {!isOwnMessage && (
        <div className="text-xs text-blue-600 font-bold mb-1">
          {message.sender?.display_name || message.sender?.username}:
        </div>
      )}
      
      <div className={`inline-block ${isOwnMessage ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
        <p className="text-xs break-words m-0">{message.content}</p>
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        {formatTime(new Date(message.created_at))}
        {isOwnMessage && !message.is_read && (
          <span className="ml-1 text-blue-600">•</span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;