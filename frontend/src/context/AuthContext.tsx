import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

interface User {
    username: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    checkLoginStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // 로그인 체크 제외 경로
    const publicPaths = ['/login', '/signup', '/account/find'];

    // 쿠키 포함해 내 정보 요청
    const checkLoginStatus = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/me`,
                { withCredentials: true }
            );

            if (res.data.success) {
                setUser({
                    username: res.data.data.username,
                    role: res.data.data.role,
                });
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (publicPaths.includes(location.pathname)) {
            setLoading(false);
            return;
        }

        checkLoginStatus();
    }, [location.pathname]);

    return (
        <AuthContext.Provider value={{ user, setUser, checkLoginStatus }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
