
import * as firebaseApp from 'firebase/app';
import { getDatabase, ref, push, set, onValue, off, update, remove, onChildAdded, onChildChanged, onChildRemoved } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FIREBASE_CONFIG } from '../constants';
import { Message } from '../types';

// Workaround for TS error: "Module 'firebase/app' has no exported member 'initializeApp'"
const initializeApp = (firebaseApp as any).initializeApp;

const app = initializeApp(FIREBASE_CONFIG);
export const db = getDatabase(app);
export const storage = getStorage(app);

export const sendMessage = async (chatId: string, message: Message) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  const newRef = push(messagesRef);
  
  // Ensure content is set for legacy support if only text is provided
  const msgData = {
    ...message,
    content: message.content || message.text || '',
    id: newRef.key
  };

  await set(newRef, msgData);
  
  const [user1, user2] = chatId.split('_');
  const updatePayload = {
    lastMessage: msgData.type === 'text' ? msgData.content : `Sent a ${msgData.type}`,
    timestamp: message.timestamp
  };
  
  await update(ref(db, `users/${user1}/chats/${user2}`), updatePayload);
  await update(ref(db, `users/${user2}/chats/${user1}`), updatePayload);
};

export const uploadMedia = async (file: File, path: string): Promise<string> => {
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

export const subscribeToChat = (chatId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  const listener = onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    const messages: Message[] = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
    callback(messages);
  });
  return () => off(messagesRef, 'value', listener);
};

// --- New Advanced Chat Functions ---

export const uploadFile = async (chatId: string, file: File): Promise<string> => {
    const path = `chat-media/${chatId}/${Date.now()}_${file.name}`;
    return uploadMedia(file, path);
};

export const uploadAudio = async (chatId: string, blob: Blob): Promise<string> => {
    const path = `chat-audio/${chatId}/${Date.now()}.webm`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, blob);
    return getDownloadURL(fileRef);
};

export const addReaction = async (chatId: string, messageId: string, userId: string, emoji: string) => {
    const reactionRef = ref(db, `chats/${chatId}/messages/${messageId}/reactions/${userId}`);
    await set(reactionRef, emoji);
};

export const markAsRead = async (chatId: string, messageId: string) => {
    const msgRef = ref(db, `chats/${chatId}/messages/${messageId}`);
    await update(msgRef, { status: 'read' });
};

export const deleteMessage = async (chatId: string, messageId: string) => {
    const msgRef = ref(db, `chats/${chatId}/messages/${messageId}`);
    await remove(msgRef);
};

export const setTypingStatus = async (chatId: string, userId: string, isTyping: boolean) => {
    const typingRef = ref(db, `chats/${chatId}/typing/${userId}`);
    await set(typingRef, isTyping);
};

export const subscribeToTypingStatus = (chatId: string, otherUserId: string, callback: (isTyping: boolean) => void) => {
    const typingRef = ref(db, `chats/${chatId}/typing/${otherUserId}`);
    const listener = onValue(typingRef, (snapshot) => {
        callback(!!snapshot.val());
    });
    return () => off(typingRef, 'value', listener);
};

export const clearChatHistory = async (chatId: string) => {
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    await remove(messagesRef);
};

export const subscribeToMessagesWithUpdates = (
    chatId: string,
    onAdd: (msg: Message) => void,
    onChange: (msg: Message) => void,
    onRemove: (id: string) => void
) => {
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    
    const added = onChildAdded(messagesRef, (snapshot) => {
        const val = snapshot.val();
        if (val) onAdd({ ...val, id: snapshot.key });
    });

    const changed = onChildChanged(messagesRef, (snapshot) => {
        const val = snapshot.val();
        if (val) onChange({ ...val, id: snapshot.key });
    });

    const removed = onChildRemoved(messagesRef, (snapshot) => {
        onRemove(snapshot.key!);
    });

    return () => {
        off(messagesRef, 'child_added', added);
        off(messagesRef, 'child_changed', changed);
        off(messagesRef, 'child_removed', removed);
    };
};

// --- WebRTC Signaling Helper Functions ---

export const listenForIncomingCalls = (userId: string, onCall: (data: any) => void) => {
    const callRef = ref(db, `users/${userId}/incoming_call`);
    const listener = onValue(callRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            onCall(data);
        }
    });
    return () => off(callRef, 'value', listener);
};

export const initiateCall = async (from: string, to: string, isVideo: boolean, offer: any) => {
    const callData = {
        from,
        to,
        isVideo,
        isCaller: false, // The receiver is not the caller
        offer: JSON.parse(JSON.stringify(offer)),
        timestamp: Date.now()
    };
    await set(ref(db, `users/${to}/incoming_call`), callData);
};

export const answerCall = async (callerId: string, answer: any) => {
    await set(ref(db, `users/${callerId}/call_response`), {
        type: 'answer',
        answer: JSON.parse(JSON.stringify(answer))
    });
};

export const listenForAnswer = (userId: string, onAnswer: (answer: any) => void) => {
    const responseRef = ref(db, `users/${userId}/call_response`);
    const listener = onValue(responseRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.type === 'answer') {
            onAnswer(data.answer);
            remove(responseRef); // Clear after handling
        }
    });
    return () => off(responseRef, 'value', listener);
};

export const addIceCandidate = async (targetUser: string, candidate: any) => {
    const candidatesRef = ref(db, `users/${targetUser}/candidates`);
    await push(candidatesRef, candidate);
};

export const listenForIceCandidates = (userId: string, onCandidate: (candidate: any) => void) => {
    const candidatesRef = ref(db, `users/${userId}/candidates`);
    const listener = onChildAdded(candidatesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            onCandidate(data);
            remove(ref(db, `users/${userId}/candidates/${snapshot.key}`)); // Process once
        }
    });
    return () => off(candidatesRef, 'child_added', listener);
};

export const endCallSignal = async (targetUser: string) => {
    await remove(ref(db, `users/${targetUser}/incoming_call`));
    await remove(ref(db, `users/${targetUser}/call_response`));
    await remove(ref(db, `users/${targetUser}/candidates`));
};
