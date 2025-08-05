import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import MessageBubble from './MessageBubble';
import { X } from 'lucide-react';

interface PrivateChatProps {
  recipient: any;
  onClose: () => void;
}

const PrivateChat: React.FC<PrivateChatProps> = ({ recipient, onClose }) => {
  const { user } = useAuth();
  const { messages, sendPrivateMessage } = useSocket();
  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const privateMessages = messages.filter(msg => 
    (msg.sender_id === user?.id && msg.receiver_id === recipient.id) ||
    (msg.sender_id === recipient.id && msg.receiver_id === user?.id)
  );

  useEffect(() => {
    scrollToBottom();
  }, [privateMessages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() && user) {
      await sendPrivateMessage(message.trim(), recipient.id);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[450px] shadow-lg z-50 bg-gray-200 border border-gray-400 rounded-lg flex flex-col">
      {/* Title Bar */}
      <div className="bg-blue-600 text-white p-2 flex items-center justify-between rounded-t-lg">
        <h2 className="text-sm font-bold">{recipient.username} - Instant Message</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-blue-700 p-1 h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Menu Bar */}
      <div className="bg-gray-100 border-b border-gray-300 px-2 py-1 text-xs">
        File Edit View Actions Help
      </div>

      {/* Message Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 bg-white p-3">
        <div className="space-y-1">
          {privateMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.sender_id === user?.id}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-2 border-t border-gray-300">
        <div className="flex items-center space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 text-sm rounded-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="sm"
            className="rounded-sm"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivateChat;