
import React from 'react';
import { DEFAULT_AVATAR } from '../constants';

interface FriendProfileViewProps {
  name: string;
  phoneNumber: string;
  avatar?: string;
  onClose: () => void;
  onStartChat: () => void;
}

const FriendProfileView: React.FC<FriendProfileViewProps> = ({ 
  name, 
  phoneNumber, 
  avatar, 
  onClose,
  onStartChat
}) => {
  const isAI = name === 'Meta AI';

  return (
    <div className="fixed inset-0 z-[60] bg-[#f0f2f5] flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-3 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded-full transition text-gray-600">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="text-xl font-medium text-gray-800">Contact Info</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* Profile Picture & Info */}
        <div className="bg-white pb-6 pt-8 flex flex-col items-center shadow-sm mb-3">
           <div className="w-32 h-32 rounded-full overflow-hidden mb-4 ring-4 ring-gray-50 relative group cursor-pointer">
              {isAI ? (
                 <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl">
                     <i className="fas fa-robot"></i>
                 </div>
              ) : (
                 <img src={avatar || DEFAULT_AVATAR} alt={name} className="w-full h-full object-cover" />
              )}
           </div>
           <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
           <p className="text-gray-500 text-lg mt-1">{phoneNumber}</p>
           
           <div className="flex gap-6 mt-6 w-full justify-center px-8">
               <button onClick={onStartChat} className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-wa-light group-hover:bg-emerald-50 transition-colors text-xl shadow-sm">
                       <i className="fas fa-comment-alt"></i>
                   </div>
                   <span className="text-xs font-medium text-gray-500">Message</span>
               </button>
               <button className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-wa-light group-hover:bg-emerald-50 transition-colors text-xl shadow-sm">
                       <i className="fas fa-phone"></i>
                   </div>
                   <span className="text-xs font-medium text-gray-500">Audio</span>
               </button>
               <button className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-wa-light group-hover:bg-emerald-50 transition-colors text-xl shadow-sm">
                       <i className="fas fa-video"></i>
                   </div>
                   <span className="text-xs font-medium text-gray-500">Video</span>
               </button>
           </div>
        </div>

        {/* About / Status */}
        {!isAI && (
            <div className="bg-white p-4 shadow-sm mb-3">
                <h3 className="text-gray-500 font-medium text-sm mb-1">About</h3>
                <p className="text-gray-800">Hey there! I am using WhatsApp.</p>
                <p className="text-gray-400 text-xs mt-2">September 24, 2024</p>
            </div>
        )}

        {/* Media Links Docs */}
        <div className="bg-white p-4 shadow-sm mb-3 flex items-center justify-between cursor-pointer hover:bg-gray-50">
            <span className="text-gray-800 font-medium">Media, links, and docs</span>
            <div className="flex items-center gap-1 text-gray-400">
                <span className="text-xs">0</span>
                <i className="fas fa-chevron-right text-xs"></i>
            </div>
        </div>

        {/* Settings / Actions */}
        <div className="bg-white shadow-sm mb-3">
             <div className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                 <i className="fas fa-star text-gray-400 text-lg w-6"></i>
                 <div className="flex-1">
                     <p className="text-gray-800 font-medium">Starred messages</p>
                     <p className="text-gray-500 text-xs">None</p>
                 </div>
                 <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
             </div>
             <div className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                 <i className="fas fa-search text-gray-400 text-lg w-6"></i>
                 <p className="text-gray-800 font-medium">Chat search</p>
             </div>
        </div>

         {/* Security */}
         <div className="bg-white shadow-sm mb-3 p-4">
             <div className="flex items-start gap-4">
                 <i className="fas fa-lock text-gray-400 text-lg w-6 mt-1"></i>
                 <div>
                     <p className="text-gray-800 font-medium">Encryption</p>
                     <p className="text-gray-500 text-xs leading-snug">Messages and calls are end-to-end encrypted. Tap to verify.</p>
                 </div>
             </div>
         </div>

        {/* Danger Actions */}
        <div className="bg-white shadow-sm p-2">
             <button className="w-full p-3 text-left flex items-center gap-4 text-red-500 hover:bg-red-50 transition-colors font-medium">
                 <i className="fas fa-ban text-lg w-6"></i>
                 Block {name}
             </button>
             <button className="w-full p-3 text-left flex items-center gap-4 text-red-500 hover:bg-red-50 transition-colors font-medium">
                 <i className="fas fa-thumbs-down text-lg w-6"></i>
                 Report {name}
             </button>
        </div>
      </div>
    </div>
  );
};

export default FriendProfileView;
