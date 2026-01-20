import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [rememberMe, setRememberMe] = useState(false);
    const BASE_URL = import.meta.env.VITE_API_URL;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const response = await axios.post(`${BASE_URL}/api/login`,
                { username, password, rememberMe },
                { withCredentials: true }
            );

            if (response.data.success) {
                setUser(username);
                navigate('/');
            }
        } catch (error) {
            console.error("로그인 실패:", error);
            alert("아이디 또는 비밀번호를 확인하세요.");
        }
    };

    return (
        <div className="container d-flex flex-column justify-content-center align-items-center vh-100 text-center">

            <h1><Link className="nav-link mb-5 text-primary fw-bold" to="/">위드유</Link></h1>

            <div className="card shadow-lg p-4 rounded-4 w-100" style={{ maxWidth: '420px' }}>
                
                <h3 className="text-center fw-bold mb-4">로그인</h3>

                <form onSubmit={handleLogin} className="text-start">
                    {/* 아이디 */}
                    <div className="mb-3">
                        <label className="form-label">아이디</label>
                        <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="아이디를 입력하세요"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div className="mb-4">
                        <label className="form-label">비밀번호</label>
                        <input
                            type="password"
                            className="form-control form-control-lg"
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    {/* 로그인 유지 + 계정찾기 */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor="rememberMe">
                                로그인 유지
                            </label>
                        </div>

                        <Link to="/account/find" className="small text-decoration-none">
                            계정찾기
                        </Link>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-100 mb-3">
                        로그인
                    </button>

                    <div className="text-center mb-4">
                        <span className="text-muted small">계정이 없으신가요? </span>
                        <Link to="/signup" className="fw-semibold text-decoration-none">
                            회원가입
                        </Link>
                    </div>
                </form>

                {/* 구분선 */}
                <div className="d-flex align-items-center my-4">
                    <hr className="flex-grow-1" />
                    <span className="px-2 text-muted small">간편 로그인</span>
                    <hr className="flex-grow-1" />
                </div>

                {/* 소셜 로그인 */}
                <div className="d-grid gap-2">
                    <button className="btn btn-outline-dark d-flex align-items-center justify-content-center py-2">
                        <img
                            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                            alt="Google"
                            width="18"
                            className="me-2"
                        />
                        Google 로그인
                    </button>

                    <button
                        className="btn d-flex align-items-center justify-content-center py-2"
                        style={{ backgroundColor: '#FEE500' }}
                    >
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg"
                            alt="Kakao"
                            width="18"
                            className="me-2"
                        />
                        Kakao 로그인
                    </button>
                </div>

            </div>
        </div>
    );
}

export default LoginPage;
