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
    <Card className="fixed bottom-4 right-4 w-80 h-96 shadow-chat z-50 bg-background">
      <CardHeader className="gradient-yahoo text-white p-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={recipient.avatar} />
              <AvatarFallback className="text-xs">
                {recipient.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{recipient.username}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCall}
              className="text-white hover:bg-white/10 p-1 h-6 w-6"
            >
              {isInCall ? <PhoneOff className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/10 p-1 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 h-full flex flex-col">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-3 yahoo-scrollbar">
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
        
        <div className="p-3 border-t border-border">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`p-2 ${isRecording ? 'bg-destructive text-white' : ''}`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              size="sm"
              className="p-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivateChat;