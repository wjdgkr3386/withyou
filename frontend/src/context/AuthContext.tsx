import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const checkLoginStatus = async () => {
        try {
            // 쿠키를 포함해 내 정보 요청
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/me`, { withCredentials: true });
            if (res.data.success) {
                setUser(res.data.data); // username 저장
            }
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkLoginStatus();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, checkLoginStatus }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);