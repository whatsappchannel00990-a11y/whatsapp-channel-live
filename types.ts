
export interface User {
  phoneNumber: string;
  name: string;
  avatar?: string;
  balance: number;
  adsWatched: number;
}

export interface Message {
  id?: string;
  sender: string;
  content: string; // Unified content field (text or url)
  text?: string;   // Legacy support
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'audio';
  status?: 'sent' | 'delivered' | 'read';
  reactions?: Record<string, string>;
}

export interface ChatSession {
  chatId: string;
  friendNumber: string;
  lastMessage?: string;
  timestamp?: number;
}

export type ViewState = 'HOME' | 'WALLET' | 'PROFILE';
export type OverlayState = 'NONE' | 'INBOX' | 'CHAT' | 'EARNING' | 'RANDOM' | 'CALL_OUTGOING' | 'CALL_INCOMING' | 'FRIEND_PROFILE';

export interface CallSignal {
  type: 'offer' | 'answer' | 'candidate' | 'end';
  data?: any;
  caller?: string;
  sdp?: any;
  candidate?: any;
}

export interface CallData {
  from: string;
  to?: string;
  isVideo: boolean;
  isCaller: boolean;
  offer?: any;
  status?: string;
}
