import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Smile, Settings, Users, Mic, MicOff } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(currentRoom.id);
      }, 2000);
    }
  };

  const handleEmojiSelect = (emojiData: any) => {
    setMessageInput(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // TODO: Send voice message
        console.log('Voice recording ready:', audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const currentRoomMessages = messages.filter(msg => 
    msg.room_id === currentRoom?.id
  );

  const currentTypingUsers = currentRoom ? typingUsers[currentRoom.id] || [] : [];

  if (!currentRoom) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <CardContent>
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a room to start chatting</h3>
            <p>Choose a room from the sidebar to join the conversation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full window-chrome">
      {/* Title bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold">Yahoo! Chat - {currentRoom.name}</span>
        </div>
        <div className="flex space-x-1">
          <button className="w-4 h-4 bg-gray-300 border border-gray-500 text-xs">_</button>
          <button className="w-4 h-4 bg-gray-300 border border-gray-500 text-xs">□</button>
          <button className="w-4 h-4 bg-red-500 border border-gray-500 text-xs">×</button>
        </div>
      </div>
      
      {/* Menu bar */}
      <div className="bg-gray-200 border-b border-gray-400 px-2 py-1">
        <div className="flex space-x-4 text-xs">
          <span className="hover:bg-gray-300 px-2 py-1">File</span>
          <span className="hover:bg-gray-300 px-2 py-1">Edit</span>
          <span className="hover:bg-gray-300 px-2 py-1">View</span>
          <span className="hover:bg-gray-300 px-2 py-1">People</span>
          <span className="hover:bg-gray-300 px-2 py-1">Help</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 window-inset m-2">
        <ScrollArea className="h-full p-2 yahoo-scrollbar bg-white">
          <div className="space-y-2">
            {currentRoomMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === user?.id}
              />
            ))}
            
            {/* Typing Indicator */}
            {currentTypingUsers.length > 0 && (
              <TypingIndicator users={currentTypingUsers} />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input area */}
      <div className="m-2 bg-gray-200 border-2 inset border-gray-400 p-2">
        <div className="flex items-center space-x-2 mb-2">
          <button className="button-90s text-xs">Bold</button>
          <button className="button-90s text-xs">Italic</button>
          <button className="button-90s text-xs">Color</button>
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="button-90s text-xs"
          >
            😀
          </button>
          <div className="flex-1"></div>
          <button 
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className={`button-90s text-xs ${isRecording ? 'bg-red-300' : ''}`}
          >
            🎤
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-2 py-1 border-2 inset border-gray-400 bg-white text-sm"
            />
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 right-0 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
          <button 
            onClick={handleSendMessage} 
            disabled={!messageInput.trim()}
            className="button-90s text-xs px-4"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;