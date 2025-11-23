
import React, { useState, useEffect } from 'react';
import { ref, onValue, query, limitToLast, off } from 'firebase/database';
import { db } from '../services/firebase';
import { DEFAULT_AVATAR } from '../constants';

interface InboxProps {
    currentUserNumber: string;
    onClose: () => void;
    onStartChat: (number: string, name: string) => void;
    onViewProfile: (name: string, number: string) => void;
    onAddFriend: () => void;
}

interface ChatPreview {
    number: string;
    name: string;
    lastMessage: string;
    timestamp: number;
    unread: number;
    avatar?: string;
    isAI?: boolean;
}

const Inbox: React.FC<InboxProps> = ({ currentUserNumber, onClose, onStartChat, onViewProfile, onAddFriend }) => {
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUserNumber) return;

        // 1. Robust Local Storage Loading (Primary Source)
        // This ensures contacts are visible immediately, even if offline or before Firebase connects.
        let storedFriends: any[] = [];
        try {
            storedFriends = JSON.parse(localStorage.getItem('wa_friends') || '[]');
        } catch (e) {
            console.error("Error parsing contacts from local storage:", e);
            storedFriends = [];
        }
        
        // Initialize list with Meta AI + Stored Friends
        const initialList: ChatPreview[] = [
            {
                number: 'meta_ai',
                name: 'Meta AI Assistant',
                lastMessage: 'Ask me anything...',
                timestamp: Date.now(), 
                unread: 0,
                isAI: true
            },
            ...storedFriends.map((f: any) => ({
                number: f.number,
                name: f.name,
                lastMessage: 'Tap to start chatting',
                timestamp: 0, // Will be updated by Firebase
                unread: 0,
                isAI: false
            }))
        ];

        // 2. Immediate UI Update
        setChats(initialList);
        setLoading(false);

        // 3. Setup Real-time Firebase Listeners (Async Enhancement)
        const listeners: (() => void)[] = [];

        storedFriends.forEach((friend: any) => {
            if (!friend.number) return;
            
            // Generate consistent Chat ID
            const chatId = [currentUserNumber, friend.number].sort().join('_');
            const messagesRef = query(ref(db, `chats/${chatId}/messages`), limitToLast(1));

            const unsubscribe = onValue(messagesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const msgKeys = Object.keys(data);
                    const lastMsgKey = msgKeys[msgKeys.length - 1];
                    const lastMsg = data[lastMsgKey];
                    
                    // Determine preview text based on message type
                    let previewText = '';
                    if (lastMsg.type === 'text') previewText = lastMsg.text || lastMsg.content;
                    else if (lastMsg.type === 'image') previewText = '📷 Photo';
                    else if (lastMsg.type === 'video') previewText = '🎥 Video';
                    else if (lastMsg.type === 'audio') previewText = '🎤 Voice Message';
                    
                    // Update state with new message info
                    setChats(prevChats => {
                        const updated = prevChats.map(chat => {
                            if (chat.number === friend.number) {
                                return {
                                    ...chat,
                                    lastMessage: previewText,
                                    timestamp: lastMsg.timestamp
                                };
                            }
                            return chat;
                        });
                        // Sort by timestamp descending so active chats float to top
                        return updated.sort((a, b) => b.timestamp - a.timestamp);
                    });
                }
            }, (error) => {
                console.warn(`Firebase listener warning for ${friend.number}:`, error);
            });

            listeners.push(() => off(messagesRef, 'value', unsubscribe));
        });

        return () => {
            listeners.forEach(unsub => unsub());
        };
    }, [currentUserNumber]);

    const formatTime = (timestamp: number) => {
        if (timestamp === 0) return '';
        const date = new Date(timestamp);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 bg-white z-40 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b flex items-center bg-white shadow-sm shrink-0">
                <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition text-gray-600">
                    <i className="fas fa-arrow-left text-xl"></i>
                </button>
                <h2 className="font-bold text-xl ml-2 text-gray-800">Messages</h2>
                <div className="ml-auto bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-xs font-bold">
                    {chats.length} Chats
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="flex justify-center p-10"><i className="fas fa-circle-notch animate-spin text-wa-light text-2xl"></i></div>
                ) : chats.length === 0 ? (
                    <div className="text-center p-10 text-gray-500 mt-10">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-comment-slash text-3xl text-gray-300"></i>
                        </div>
                        <p className="font-medium">No messages yet.</p>
                        <p className="text-sm mb-4">Start a conversation with a friend!</p>
                        <button onClick={onAddFriend} className="text-emerald-600 font-bold hover:underline">Add a friend</button>
                    </div>
                ) : (
                    chats.map((chat) => (
                        <div 
                            key={chat.number} 
                            className="flex items-center p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer group"
                        >
                            {/* Avatar - Opens Profile */}
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewProfile(chat.name, chat.number);
                                }}
                                className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xl text-white shadow-sm overflow-hidden relative hover:opacity-80 transition"
                            >
                                {chat.isAI ? (
                                    <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                                        <i className="fas fa-robot"></i>
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">
                                        {chat.avatar ? (
                                            <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                                        ) : (
                                            chat.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Body - Opens Chat */}
                            <div 
                                onClick={() => onStartChat(chat.number, chat.name)} 
                                className="ml-4 flex-1 min-w-0"
                            >
                                <div className="flex justify-between items-baseline">
                                    <h4 className="font-semibold text-gray-900 truncate text-[16px]">{chat.name}</h4>
                                    <span className={`text-xs ${chat.timestamp > Date.now() - 10000 ? 'text-green-500 font-bold' : 'text-gray-400'}`}>
                                        {formatTime(chat.timestamp)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-0.5">
                                    <p className="text-sm text-gray-500 truncate pr-4 flex-1 flex items-center">
                                        {chat.isAI ? <span className="text-blue-500 text-xs mr-1"><i className="fas fa-sparkles"></i></span> : null}
                                        {chat.lastMessage}
                                    </p>
                                    {chat.unread > 0 && (
                                        <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {chat.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Add Button */}
            <button 
                onClick={onAddFriend}
                className="absolute bottom-6 right-6 w-14 h-14 bg-[#00a884] text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-emerald-600 transition-transform hover:scale-105 active:scale-95"
            >
                <i className="fas fa-comment-medical text-xl"></i>
            </button>
        </div>
    );
};

export default Inbox;
