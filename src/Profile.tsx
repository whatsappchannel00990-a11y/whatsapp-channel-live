
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_AVATAR } from '../constants';

interface ProfileProps {
    onForceLogout?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onForceLogout }) => {
    const { user, updateAvatar, updateName } = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(user.name);

    useEffect(() => {
        setTempName(user.name);
    }, [user.name]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]){
            const reader = new FileReader();
            reader.onload = (ev) => updateAvatar(ev.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSaveName = () => {
        if (tempName.trim() !== "") {
            updateName(tempName.trim());
            setIsEditingName(false);
        }
    };

    const handleCancelEdit = () => {
        setTempName(user.name);
        setIsEditingName(false);
    };

    const handleFinalLogout = () => {
        if (window.confirm("Are you sure you want to sign out?")) {
            if (onForceLogout) {
                onForceLogout();
                return;
            }
            // 🎯 FINAL ULTIMATE FIX: Minimal, Aggressive Key Removal
            
            // 1. Remove the User ID (This makes the app think no one is logged in)
            localStorage.removeItem('wa_user_number');
            
            // 2. Remove the Skip Flag (This forces the Registration Modal to appear)
            localStorage.removeItem('registrationSkipped');
            
            // 3. Clean up cosmetic data for a fresh look
            localStorage.removeItem('wa_name');
            localStorage.removeItem('wa_avatar');
            
            // 4. Force Hard Refresh from Root
            // Splits by '#' to remove HashRouter paths, Splits by '?' to remove query params
            // This guarantees we load index.html from scratch.
            window.location.replace(window.location.href.split('#')[0].split('?')[0]);
        }
    };

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer">
                <img src={user.avatar || DEFAULT_AVATAR} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-emerald-50" />
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-camera text-white"></i>
                </div>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-2 group h-10 w-full">
                 {isEditingName ? (
                     <div className="flex items-center gap-2 animate-in fade-in">
                         <input 
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="border-b-2 border-emerald-500 outline-none text-xl font-bold text-gray-800 text-center w-40 bg-transparent p-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') handleCancelEdit();
                            }}
                         />
                         <button onClick={handleSaveName} className="text-emerald-600 hover:bg-emerald-50 w-8 h-8 flex items-center justify-center rounded-full transition shadow-sm border border-emerald-100"><i className="fas fa-check"></i></button>
                         <button onClick={handleCancelEdit} className="text-red-500 hover:bg-red-50 w-8 h-8 flex items-center justify-center rounded-full transition shadow-sm border border-red-100"><i className="fas fa-times"></i></button>
                     </div>
                 ) : (
                     <>
                        <h2 className="font-bold text-xl text-gray-800">{user.name}</h2>
                        <button 
                            onClick={() => setIsEditingName(true)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-wa-light hover:bg-emerald-50 transition-colors"
                            title="Edit Name"
                        >
                            <i className="fas fa-pen text-sm"></i>
                        </button>
                     </>
                 )}
            </div>
            
            <p className="text-gray-500 text-sm mt-1">{user.phoneNumber}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             {['Account', 'Privacy', 'Notifications', 'Storage', 'Help'].map((item, i) => (
                 <div key={item} className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${i !== 4 ? 'border-b border-gray-50' : ''}`}>
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                             <i className={`fas fa-${['key', 'lock', 'bell', 'database', 'question-circle'][i]}`}></i>
                         </div>
                         <span className="font-medium text-gray-700">{item}</span>
                     </div>
                     <i className="fas fa-chevron-right text-gray-300 text-sm"></i>
                 </div>
             ))}
             <button 
                onClick={handleFinalLogout} 
                className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-red-50 border-t border-gray-100 text-red-600 transition-colors"
                type="button"
             >
                 <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                         <i className="fas fa-sign-out-alt"></i>
                     </div>
                     <span className="font-medium">Log out</span>
                 </div>
             </button>
        </div>
      </div>
    );
};
