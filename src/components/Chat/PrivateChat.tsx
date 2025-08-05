import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Send, Mic, MicOff, X, Phone, PhoneOff } from 'lucide-react';

interface PrivateChatProps {
  recipient: any;
  onClose: () => void;
}

const PrivateChat: React.FC<PrivateChatProps> = ({ recipient, onClose }) => {
  const { user } = useAuth();
  const { messages, sendPrivateMessage, typingUsers } = useSocket();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Filter messages for this private conversation
  const privateMessages = messages.filter(msg => 
    (msg.sender_id === user?.id && msg.receiver_id === recipient.id) ||
    (msg.sender_id === recipient.id && msg.receiver_id === user?.id)
  );

  // For now, disable typing indicator for private chat
  const currentTypingUsers: string[] = [];

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Handle typing indicator
    // TODO: Implement typing indicators for private chat
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
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

  const toggleCall = () => {
    setIsInCall(!isInCall);
    // TODO: Implement actual voice/video calling
    console.log(isInCall ? 'Ending call' : 'Starting call', 'with', recipient.username);
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 shadow-lg z-50 window-chrome">
      {/* Title bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold">Private Message - {recipient.username}</span>
        </div>
        <div className="flex space-x-1">
          <button className="w-3 h-3 bg-gray-300 border border-gray-500 text-xs">_</button>
          <button 
            onClick={onClose}
            className="w-3 h-3 bg-red-500 border border-gray-500 text-xs"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* User info bar */}
      <div className="bg-gray-200 border-b border-gray-400 px-2 py-1 flex items-center space-x-2">
        <Avatar className="w-6 h-6">
          <AvatarImage src={recipient.avatar} />
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {recipient.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs">{recipient.username}</span>
        <span className={`text-xs ${recipient.status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
          {recipient.status === 'online' ? '● Online' : '○ Offline'}
        </span>
        <div className="flex-1"></div>
        <button
          onClick={toggleCall}
          className={`button-90s text-xs ${isInCall ? 'bg-green-300' : ''}`}
        >
          📞
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 window-inset m-1">
        <ScrollArea ref={scrollAreaRef} className="h-full p-2 bg-white yahoo-scrollbar">
          <div className="space-y-2">
            {privateMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwnMessage={msg.sender_id === user?.id}
              />
            ))}
            
            {currentTypingUsers.length > 0 && (
              <TypingIndicator users={[recipient.username]} />
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Input area */}
      <div className="m-1 bg-gray-200 border-2 inset border-gray-400 p-1">
        <div className="flex items-center space-x-1">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-2 py-1 border-2 inset border-gray-400 bg-white text-xs"
          />
          <button
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className={`button-90s text-xs ${isRecording ? 'bg-red-300 animate-pulse' : ''}`}
          >
            🎤
          </button>
          <button 
            onClick={handleSendMessage} 
            disabled={!message.trim()}
            className="button-90s text-xs"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateChat;