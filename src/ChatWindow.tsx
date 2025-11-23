import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';
import { sendMessage, subscribeToMessagesWithUpdates, uploadFile, uploadAudio } from '../services/firebase';
import { generateAIResponse } from '../services/geminiService';
import Button from './Button';

interface ChatWindowProps {
  chatId: string;
  currentUserNumber: string;
  friendName: string;
  onBack: () => void;
  onCall: (isVideo: boolean) => void;
  onViewProfile: () => void; 
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chatId, 
  currentUserNumber, 
  friendName, 
  onBack, 
  onCall,
  onViewProfile 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isAI = friendName === 'Meta AI';

  useEffect(() => {
    // Clear messages when switching chats
    setMessages([]);

    if (isAI) {
        const stored = localStorage.getItem('meta_ai_chat');
        if(stored) setMessages(JSON.parse(stored));
        return;
    }

    // Subscribe to Firebase updates using granular listeners
    const unsubscribe = subscribeToMessagesWithUpdates(
      chatId,
      (newMsg) => {
        // onAdd: Append new message and sort
        setMessages((prev) => {
          if (prev.some(m => m.id === newMsg.id)) return prev; // Prevent duplicates
          return [...prev, newMsg].sort((a, b) => a.timestamp - b.timestamp);
        });
      },
      (updatedMsg) => {
        // onChange: Update existing message (e.g. status, reactions)
        setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      },
      (removedMsgId) => {
        // onRemove: Filter out deleted message
        setMessages((prev) => prev.filter(m => m.id !== removedMsgId));
      }
    );

    return () => unsubscribe();
  }, [chatId, isAI]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      sender: currentUserNumber,
      content: inputText,
      text: inputText,
      timestamp: Date.now(),
      type: 'text',
      status: 'sent'
    };

    if (isAI) {
       const updatedMessages = [...messages, newMessage];
       setMessages(updatedMessages);
       localStorage.setItem('meta_ai_chat', JSON.stringify(updatedMessages));
       setInputText('');
       setLoadingAI(true);

       const aiReplyText = await generateAIResponse(inputText);
       
       const aiMessage: Message = {
           sender: 'Meta AI',
           content: aiReplyText,
           text: aiReplyText,
           timestamp: Date.now(),
           type: 'text'
       };
       const finalMessages = [...updatedMessages, aiMessage];
       setMessages(finalMessages);
       localStorage.setItem('meta_ai_chat', JSON.stringify(finalMessages));
       setLoadingAI(false);
    } else {
        await sendMessage(chatId, newMessage);
        setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Media Handlers ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsUploading(true);
          const file = e.target.files[0];
          const type = file.type.startsWith('image/') ? 'image' : 'video';
          
          try {
              const url = await uploadFile(chatId, file);
              const newMessage: Message = {
                  sender: currentUserNumber,
                  content: url,
                  text: `Sent a ${type}`,
                  timestamp: Date.now(),
                  type: type,
                  status: 'sent'
              };
              await sendMessage(chatId, newMessage);
          } catch (error) {
              console.error("Upload failed", error);
              alert("Failed to upload file.");
          } finally {
              setIsUploading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      }
  };

  const handleRecordClick = async () => {
      if (isRecording) {
          // Stop recording
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          } else {
            // Fallback if mock/visual state only
            setIsRecording(false);
          }
      } else {
          // Start recording
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const mediaRecorder = new MediaRecorder(stream);
              mediaRecorderRef.current = mediaRecorder;
              audioChunksRef.current = [];

              mediaRecorder.ondataavailable = (event) => {
                  if (event.data.size > 0) audioChunksRef.current.push(event.data);
              };

              mediaRecorder.onstop = async () => {
                  const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  stream.getTracks().forEach(track => track.stop()); // Stop mic
                  
                  if (audioBlob.size > 100) {
                      setIsUploading(true);
                      try {
                          const url = await uploadAudio(chatId, audioBlob);
                          const newMessage: Message = {
                              sender: currentUserNumber,
                              content: url,
                              text: "Voice Message",
                              timestamp: Date.now(),
                              type: 'audio',
                              status: 'sent'
                          };
                          await sendMessage(chatId, newMessage);
                      } catch (error) {
                          console.error("Audio upload failed", error);
                      } finally {
                          setIsUploading(false);
                      }
                  }
                  setIsRecording(false); // Ensure state is reset
              };

              mediaRecorder.start();
              setIsRecording(true);
          } catch (err) {
              console.error("Microphone access denied or not supported", err);
              // Mock UI behavior for demo if real mic fails
              setIsRecording(true);
              // Auto-stop mock recording after 3 seconds
              setTimeout(() => {
                  setIsRecording(false);
                  alert("Microphone access required for real voice messages. (Mock recording finished)");
              }, 3000);
          }
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-wa-dark text-white shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="hover:bg-white/10 p-2 rounded-full transition">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-lg py-1 pr-3 transition"
            onClick={onViewProfile}
          >
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                {isAI ? (
                   <div className="bg-gradient-to-tr from-blue-500 to-purple-600 w-full h-full flex items-center justify-center text-white">
                       <i className="fas fa-robot"></i>
                   </div>
                ) : (
                    friendName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg leading-tight">{friendName}</h3>
                {loadingAI && <span className="text-xs text-gray-200 italic">typing...</span>}
                {isUploading && <span className="text-xs text-gray-200 italic">sending media...</span>}
              </div>
          </div>
        </div>
        <div className="flex gap-4 mr-2">
          {!isAI && (
            <>
                <button onClick={() => onCall(false)} className="hover:text-gray-300"><i className="fas fa-phone"></i></button>
                <button onClick={() => onCall(true)} className="hover:text-gray-300"><i className="fas fa-video"></i></button>
            </>
          )}
          <button className="hover:text-gray-300"><i className="fas fa-ellipsis-v"></i></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.map((msg, idx) => {
          const isMe = msg.sender === currentUserNumber;
          return (
            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] px-3 py-2 rounded-lg shadow-sm relative ${
                  isMe ? 'bg-wa-chat text-black rounded-tr-none' : 'bg-white text-black rounded-tl-none'
                }`}
              >
                {msg.type === 'text' && (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {msg.text || msg.content}
                    </p>
                )}
                {msg.type === 'image' && (
                    <div className="mb-1 rounded-lg overflow-hidden">
                        <img src={msg.content} alt="sent" className="max-w-full h-auto max-h-[300px] object-cover" />
                    </div>
                )}
                {msg.type === 'video' && (
                    <div className="mb-1 rounded-lg overflow-hidden">
                        <video src={msg.content} controls className="max-w-full h-auto max-h-[300px]" />
                    </div>
                )}
                {msg.type === 'audio' && (
                    <div className="flex items-center gap-2 min-w-[200px] py-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                            <i className="fas fa-microphone"></i>
                        </div>
                        <audio src={msg.content} controls className="h-8 w-48" />
                    </div>
                )}

                <div className="text-[10px] text-gray-500 text-right mt-1 select-none flex items-center justify-end gap-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  {isMe && (
                      <i className={`fas ${msg.status === 'read' ? 'fa-check-double text-blue-500' : 'fa-check text-gray-400'}`}></i>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 bg-[#f0f2f5] flex items-center gap-2 shrink-0">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleFileSelect}
        />
        
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:bg-gray-200 rounded-full transition"
            disabled={isUploading}
        >
             <i className="fas fa-plus text-xl"></i>
        </button>
        
        <div className="flex-1 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 focus-within:border-wa-light">
            {isRecording ? (
                <div className="flex items-center text-red-500 font-medium animate-pulse">
                    <i className="fas fa-circle mr-2 text-xs"></i> Recording...
                </div>
            ) : (
                <input
                    type="text"
                    className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-500"
                    placeholder="Type a message"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            )}
        </div>

        {inputText.trim() ? (
            <button 
                onClick={handleSend} 
                className="p-3 rounded-full transition shadow-sm bg-wa-light text-white hover:bg-emerald-600"
            >
                <i className="fas fa-paper-plane text-lg"></i>
            </button>
        ) : (
            <button 
                onClick={handleRecordClick}
                className={`p-3 rounded-full transition shadow-sm ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                disabled={isUploading}
            >
                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-lg`}></i>
            </button>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;