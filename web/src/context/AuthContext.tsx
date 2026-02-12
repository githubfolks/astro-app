import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

interface User {
    id: number;
    email: string;
    phone_number: string;
    role: 'SEEKER' | 'ASTROLOGER' | 'ADMIN';
    full_name?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Async initialization from cross-platform storage
    useEffect(() => {
        const loadAuth = async () => {
            try {
                const storedToken = await storage.getItem('token');
                const storedUser = await storage.getItem('user');
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Failed to load auth state:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadAuth();
    }, []);

    const login = async (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        await storage.setItem('token', newToken);
        await storage.setItem('user', JSON.stringify(newUser));
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
        await storage.removeItem('token');
        await storage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
