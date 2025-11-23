
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
    user: User;
    loading: boolean;
    register: (number: string) => void;
    updateName: (name: string) => void;
    updateAvatar: (url: string) => void;
    addAdReward: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>({
        phoneNumber: '',
        name: 'Guest User',
        balance: 45.00,
        adsWatched: 0,
        avatar: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedNumber = localStorage.getItem('wa_user_number');
        const storedName = localStorage.getItem('wa_name');
        const storedAvatar = localStorage.getItem('wa_avatar');
        const storedBalance = localStorage.getItem('wa_balance');
        const storedAds = localStorage.getItem('wa_ads');
        const isLoggedIn = localStorage.getItem('isUserLoggedIn');

        if (storedNumber && isLoggedIn === 'true') {
            setUser({
                phoneNumber: storedNumber,
                name: storedName || 'User',
                avatar: storedAvatar || '',
                balance: storedBalance ? parseFloat(storedBalance) : 45.00,
                adsWatched: storedAds ? parseInt(storedAds) : 0
            });
        }
        setLoading(false);
    }, []);

    const register = (number: string) => {
        // Reset old data for a fresh slate
        localStorage.removeItem('registrationSkipped');
        localStorage.setItem('wa_balance', '45.00');
        localStorage.setItem('wa_ads', '0');
        localStorage.removeItem('wa_avatar');

        // Save new user data
        localStorage.setItem('wa_user_number', number);
        const defaultName = 'User';
        localStorage.setItem('wa_name', defaultName);
        
        // Set permanent login flag
        localStorage.setItem('isUserLoggedIn', 'true');

        setUser({
            phoneNumber: number,
            name: defaultName,
            balance: 45.00,
            adsWatched: 0,
            avatar: ''
        });
    };

    const updateName = (name: string) => {
        localStorage.setItem('wa_name', name);
        setUser(prev => ({ ...prev, name }));
    };

    const updateAvatar = (url: string) => {
        localStorage.setItem('wa_avatar', url);
        setUser(prev => ({ ...prev, avatar: url }));
    };

    const addAdReward = () => {
        setUser(prev => {
            const newBalance = prev.balance + 1.5;
            const newAds = prev.adsWatched + 1;
            localStorage.setItem('wa_balance', newBalance.toString());
            localStorage.setItem('wa_ads', newAds.toString());
            return { ...prev, balance: newBalance, adsWatched: newAds };
        });
    };

    const logout = () => {
        // 1. Clear Local Storage (removes isUserLoggedIn and everything else)
        localStorage.clear();

        // 2. Reset React State
        setUser({
            phoneNumber: '',
            name: 'Guest User',
            balance: 45.00,
            adsWatched: 0,
            avatar: ''
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, register, updateName, updateAvatar, addAdReward, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
