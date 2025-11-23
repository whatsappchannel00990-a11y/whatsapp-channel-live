
import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database'; // Added Firebase imports
import { db } from './services/firebase'; // Added db import
import { ViewState, OverlayState, ChatSession } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Button from './components/Button';
import ChatWindow from './components/ChatWindow';
import VideoCallOverlay from './components/VideoCallOverlay';
import FriendProfileView from './components/FriendProfileView';
import { ConnectGuideOverlay } from './components/ConnectGuideOverlay';
import { Profile } from './components/Profile';
import { Wallet } from './components/Wallet';
import Inbox from './components/Inbox';

// --- Sub-components for views (HomeView remains unchanged) ---
const HomeView: React.FC<{ onOpenEarning: () => void; onOpenInbox: () => void; onAddFriend: () => void }> = ({ onOpenEarning, onOpenInbox, onAddFriend }) => (
  <div className="space-y-4">
    {/* Earning Banner */}
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onOpenEarning}>
      <div className="w-16 h-16 rounded-xl bg-gradient-to-b from-wa-light to-emerald-600 flex items-center justify-center text-white text-4xl font-bold shrink-0 shadow-lg shadow-emerald-200">
        <i className="fab fa-whatsapp Channel"></i>
      </div>
      <div className="flex-1">
        <h2 className="font-bold text-gray-800 text-lg leading-tight">Earn ৳500-1000 daily</h2>
        <p className="text-gray-500 text-sm mt-1">Watch short videos & earn rewards immediately.</p>
        <div className="mt-3 flex gap-2">
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-medium">Trusted</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">Instant Payout</span>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-700 mb-3 px-1">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-3">
        <button onClick={onOpenInbox} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition group">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fas fa-inbox text-lg"></i>
          </div>
          <span className="text-xs font-medium text-gray-600">Inbox</span>
        </button>
        <button onClick={onAddFriend} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition group">
           <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fas fa-user-plus text-lg"></i>
          </div>
          <span className="text-xs font-medium text-gray-600 text-center">Add Friend</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-purple-100 transition group">
           <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fas fa-users text-lg"></i>
          </div>
          <span className="text-xs font-medium text-gray-600">Group</span>
        </button>
        <button onClick={() => window.open('https://polokmd851-png.github.io/nusrat_imo.html/', '_blank')} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-pink-100 transition group">
           <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fas fa-video text-lg"></i>
          </div>
          <span className="text-xs font-medium text-gray-600">Random</span>
        </button>
      </div>
    </div>

    {/* Articles */}
    <div className="space-y-3">
        <h3 className="font-semibold text-gray-700 px-1">Trending Today</h3>
        {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <img src={`https://picsum.photos/200/200?random=${i}`} alt="Article" className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1 flex flex-col justify-between py-1">
                    <h4 className="font-semibold text-gray-800 text-sm line-clamp-2">Technology is changing how we communicate in 2025</h4>
                    <span className="text-xs text-gray-400">2 hours ago • Tech</span>
                </div>
            </div>
        ))}
    </div>
  </div>
);

const AppContent = () => {
  const { user, register, addAdReward, loading } = useAuth();
  const [view, setView] = useState<ViewState>('HOME');
  const [overlay, setOverlay] = useState<OverlayState>('NONE');
  const [showRegistration, setShowRegistration] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [viewingFriend, setViewingFriend] = useState<{name: string, number: string, avatar?: string} | null>(null);
  const [videoCall, setVideoCall] = useState<{isActive: boolean, isCaller: boolean, isVideo: boolean} | null>(null);
  const [contacts, setContacts] = useState<{number: string, name: string}[]>([]);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  
  // 🎯 NEW STATE: Stores number temporarily during the guide flow
  const [tempNumberForGuide, setTempNumberForGuide] = useState('');

  // Main Auth Check & Contact Load
  useEffect(() => {
    // 🎯 Final Check: Only show registration if user is NOT logged in and loading is finished.
    if (!user.phoneNumber && !loading) {
        setShowRegistration(true);
    } else {
        setShowRegistration(false);
    }

    // Load contacts
    const storedContacts = JSON.parse(localStorage.getItem('wa_friends') || '[]');
    setContacts(storedContacts);
  }, [user.phoneNumber, loading]);

  // FINAL: Finalize Registration (Called by final button only)
  const handleFinalizeRegistration = (number: string) => {
      register(number);
      // After successful registration, close the overlay
      setShowRegistration(false);
      setTempNumberForGuide('');
  };

  // NEW: Initial number submission from ConnectGuideOverlay Phase 1
  const handleFinalNumberSubmit = (number: string) => {
      // 1. Store the number temporarily
      setTempNumberForGuide(number);
      // 2. The guide overlay itself handles the phase transition (INPUT -> GUIDE)
      // No need to set showRegistration(false) here.
  };

  const handleForceLogout = () => {
      localStorage.clear();
      window.location.replace(window.location.origin);
  };

  // ... (handleWatchAd, handleStartChat, handleViewProfile, handleAddFriendSubmit, handleCall remain unchanged) ...
  
  const handleWatchAd = () => {
      window.open('https://www.facebook.com/reel', '_blank');
      setTimeout(() => {
          addAdReward();
          alert("Reward added! +৳1.50");
      }, 5000);
  };

  const handleStartChat = (friendNumber: string, friendName: string) => {
      if (!user.phoneNumber) {
          setShowRegistration(true);
          return;
      }
      const sorted = [user.phoneNumber, friendNumber].sort();
      const chatId = sorted.join('_');
      setActiveChat({ chatId, friendNumber: friendName });
      setOverlay('CHAT');
  };

  const handleViewProfile = (name: string, number: string) => {
      setViewingFriend({ name, number });
      setOverlay('FRIEND_PROFILE');
  };

  const handleAddFriendSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsAddingFriend(true);
      const formData = new FormData(e.currentTarget);
      const number = formData.get('number') as string;
      const name = formData.get('name') as string || number;

      if (number) {
          try {
              // 🎯 Firebase Verification: Check if user exists
              const userSnapshot = await get(ref(db, `users/${number}`));
              
              if (userSnapshot.exists()) {
                  const newContact = { number, name };
                  // Check if already exists locally
                  if (!contacts.some(c => c.number === number)) {
                      const updatedContacts = [...contacts, newContact];
                      setContacts(updatedContacts);
                      localStorage.setItem('wa_friends', JSON.stringify(updatedContacts));
                  }
                  setShowAddFriendModal(false);
                  handleStartChat(number, name);
              } else {
                  alert("এই ব্যবহারকারী এখনও WhatsApp Channel অ্যাপে নেই।");
              }
          } catch (error) {
              console.error("Error adding friend:", error);
              alert("Connection error. Please check your internet.");
          } finally {
              setIsAddingFriend(false);
          }
      } else {
          setIsAddingFriend(false);
      }
  };

  const handleCall = (isVideo: boolean) => {
      setVideoCall({ isActive: true, isCaller: true, isVideo });
  };
  
  const renderOverlay = () => {
      if (videoCall?.isActive && activeChat) {
          return (
              <VideoCallOverlay 
                 chatId={activeChat.chatId}
                 currentUser={user.phoneNumber}
                 isCaller={videoCall.isCaller}
                 isVideo={videoCall.isVideo}
                 onEndCall={() => setVideoCall(null)}
              />
          );
      }

      switch(overlay) {
          case 'EARNING':
              return (
                  <div className="fixed inset-x-0 bottom-0 h-[90vh] bg-gray-50 rounded-t-3xl shadow-2xl z-40 flex flex-col animate-slide-up">
                      <div className="p-4 border-b bg-white rounded-t-3xl flex items-center">
                          <button onClick={() => setOverlay('NONE')}><i className="fas fa-arrow-left text-xl p-2"></i></button>
                          <h2 className="font-bold text-xl ml-4">Meta Rewards</h2>
                      </div>
                      <div className="p-6 space-y-6 overflow-y-auto">
                          <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                              <p className="text-gray-500 font-medium uppercase text-xs tracking-wide">Current Balance</p>
                              <div className="text-4xl font-bold text-emerald-600 my-2">৳ {user.balance.toFixed(2)}</div>
                              <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
                                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(user.adsWatched / 50) * 100}%` }}></div>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">Daily Goal: {user.adsWatched}/50 Videos</p>
                          </div>
                          <Button fullWidth size="lg" onClick={handleWatchAd} className="shadow-lg shadow-emerald-200">
                              <i className="fas fa-play mr-2"></i> Watch Reels & Earn
                          </Button>
                      </div>
                  </div>
              );
          case 'INBOX':
              return (
                  <Inbox 
                      currentUserNumber={user.phoneNumber}
                      onClose={() => setOverlay('NONE')}
                      onStartChat={handleStartChat}
                      onViewProfile={handleViewProfile}
                      onAddFriend={() => {
                          setOverlay('NONE');
                          setShowAddFriendModal(true);
                      }}
                  />
              );
          case 'CHAT':
              return activeChat ? (
                  <div className="fixed inset-0 z-50">
                     <ChatWindow 
                        chatId={activeChat.chatId}
                        currentUserNumber={user.phoneNumber}
                        friendName={activeChat.friendNumber}
                        onBack={() => {
                            setOverlay('NONE');
                            setActiveChat(null);
                        }}
                        onCall={handleCall}
                        onViewProfile={() => handleViewProfile(activeChat.friendNumber, activeChat.chatId.replace(user.phoneNumber, '').replace('_', ''))}
                     />
                  </div>
              ) : null;
          case 'FRIEND_PROFILE':
              return viewingFriend ? (
                  <FriendProfileView 
                      name={viewingFriend.name}
                      phoneNumber={viewingFriend.number}
                      onClose={() => setOverlay('NONE')}
                      onStartChat={() => {
                         handleStartChat(viewingFriend.number, viewingFriend.name);
                      }}
                  />
              ) : null;
          default: return null;
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative overflow-hidden shadow-2xl sm:rounded-3xl sm:my-8 sm:border-8 sm:border-gray-800 box-border">
      {/* Registration / Connect Guide Overlay - The PRIMARY entry point */}
      <ConnectGuideOverlay 
          isOpen={showRegistration} 
          onFinalizeRegistration={handleFinalizeRegistration} 
          onFinalNumberSubmit={handleFinalNumberSubmit} // 🎯 Prop Updated Here
          onClose={() => {
              // Prevent closing if not logged in
              if (user.phoneNumber) setShowRegistration(false);
          }} 
          phoneNumber={tempNumberForGuide}
      />

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                        <i className="fas fa-user-plus"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Add New Friend</h3>
                    <p className="text-sm text-gray-500">Enter their details to start chatting</p>
                </div>
                <form onSubmit={handleAddFriendSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                        <input name="number" type="tel" required placeholder="e.g. 017XXXXXXXX" className="w-full p-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50 text-lg font-medium" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name (Optional)</label>
                        <input name="name" type="text" placeholder="e.g. Rahim" className="w-full p-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50" />
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setShowAddFriendModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Cancel</button>
                        <button type="submit" disabled={isAddingFriend} className="flex-1 py-3 bg-wa-light text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-200 flex items-center justify-center">
                             {isAddingFriend ? <i className="fas fa-circle-notch animate-spin"></i> : 'Add & Chat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Status Bar / Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-5 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2 text-wa-light font-bold text-xl tracking-tight">
              <i className="fab fa-whatsapp text-2xl"></i>
              <span>WhatsApp</span>
          </div>
          <div 
             onClick={() => setView('WALLET')}
             className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 cursor-pointer hover:bg-emerald-100 transition"
          >
              <i className="fas fa-wallet"></i>
              <span>৳{Math.floor(user.balance)}</span>
          </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="p-4 pb-24 min-h-[85vh] overflow-y-auto no-scrollbar">
          {view === 'HOME' && <HomeView onOpenEarning={() => setOverlay('EARNING')} onOpenInbox={() => setOverlay('INBOX')} onAddFriend={() => setShowAddFriendModal(true)} />}
          {view === 'WALLET' && <Wallet />}
          {view === 'PROFILE' && <Profile onForceLogout={handleForceLogout} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-100 py-3 px-6 flex justify-between items-center z-30 pb-6 sm:pb-3 sm:rounded-b-2xl">
          <button 
            onClick={() => setView('HOME')} 
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'HOME' ? 'text-wa-light' : 'text-gray-400 hover:text-gray-600'}`}
          >
              <i className={`text-xl ${view === 'HOME' ? 'fas fa-home' : 'fas fa-home'}`}></i>
              <span className="text-[10px] font-medium">Home</span>
          </button>
          <button 
            onClick={() => setView('WALLET')} 
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'WALLET' ? 'text-wa-light' : 'text-gray-400 hover:text-gray-600'}`}
          >
              <i className={`text-xl ${view === 'WALLET' ? 'fas fa-wallet' : 'fas fa-wallet'}`}></i>
              <span className="text-[10px] font-medium">Wallet</span>
          </button>
          <button 
            onClick={() => setView('PROFILE')} 
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'PROFILE' ? 'text-wa-light' : 'text-gray-400 hover:text-gray-600'}`}
          >
              <i className={`text-xl ${view === 'PROFILE' ? 'fas fa-user' : 'far fa-user'}`}></i>
              <span className="text-[10px] font-medium">Profile</span>
          </button>
      </nav>

      {/* Overlays */}
      {renderOverlay()}

      <style>{`
        @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-in.fade-in {
            animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

function App() {
  // Request notification permission on load
  useEffect(() => {
      if ('Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission();
      }
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
