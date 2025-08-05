import React from 'react';
import { Message } from '@/contexts/SocketContext';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  if (message.message_type === 'system') {
    return (
      <div>
        <p className="text-xs text-gray-500 italic">{message.content}</p>
      </div>
    );
  }

  const senderName = message.sender?.display_name || message.sender?.username || 'User';

  return (
    <div>
      <p className="text-sm">
        <span className="font-bold text-blue-600">{senderName}:</span> {message.content}
      </p>
    </div>
  );
};

export default MessageBubble;