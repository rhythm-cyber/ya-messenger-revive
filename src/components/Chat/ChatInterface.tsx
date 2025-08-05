import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Users } from 'lucide-react';

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const { 
    messages, 
    currentRoom, 
    sendMessage, 
    typingUsers, 
    startTyping, 
    stopTyping 
  } = useSocket();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && currentRoom) {
      sendMessage(messageInput.trim(), currentRoom.id);
      setMessageInput('');
      stopTyping(currentRoom.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (currentRoom) {
      startTyping(currentRoom.id);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(currentRoom.id);
      }, 2000);
    }
  };

  const currentRoomMessages = messages.filter(msg => 
    msg.room_id === currentRoom?.id
  );

  const currentTypingUsers = currentRoom ? typingUsers[currentRoom.id] || [] : [];

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white border border-gray-300">
        <div className="text-center text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a room to start chatting</h3>
          <p>Choose a room from the sidebar to join the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white border border-gray-300">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 px-2 py-1 text-xs">
        <Button variant="ghost" size="sm" className="text-xs">PM</Button>
        <Button variant="ghost" size="sm" className="text-xs">Add</Button>
        <Button variant="ghost" size="sm" className="text-xs">Options</Button>
        <Button variant="ghost" size="sm" className="text-xs">Voice</Button>
        <Button variant="ghost" size="sm" className="text-xs">Chat</Button>
        <Button variant="ghost" size="sm" className="text-xs">Refresh</Button>
        <Button variant="ghost" size="sm" className="text-xs">Shield</Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {currentRoomMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.sender_id === user?.id}
            />
          ))}

          {currentTypingUsers.length > 0 && (
            <TypingIndicator users={currentTypingUsers} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-gray-300 p-2">
        <div className="flex items-center space-x-2">
          <Input
            placeholder={`Message #${currentRoom.name}`}
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-sm"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="rounded-sm"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;