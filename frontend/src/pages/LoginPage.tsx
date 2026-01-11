import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        // 로그인 로직 구현부
        console.log('Login attempt:', { username, password });
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <div className="card shadow-sm p-4" style={{ width: '100%', maxWidth: '400px', borderRadius: '15px' }}>
                <h2 className="text-center mb-4 fw-bold">로그인</h2>
                
                <form onSubmit={handleLogin}>
                    {/* 아이디 입력 */}
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

                    {/* 비밀번호 입력 */}
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

                    {/* 로그인 버튼 */}
                    <button type="submit" className="btn btn-primary btn-lg w-100 mb-3">
                        로그인
                    </button>

                    {/* 회원가입 이동 */}
                    <div className="text-center mb-4">
                        <span className="text-muted small">계정이 없으신가요? </span>
                        <Link to="/signup" className="text-decoration-none small fw-bold">회원가입</Link>
                    </div>
                </form>

                <div className="hr-sect mb-4" style={{ display: 'flex', alignItems: 'center', color: '#aaa', fontSize: '12px' }}>
                    <div style={{ flexGrow: 1, height: '1px', backgroundColor: '#eee' }}></div>
                    <div style={{ padding: '0 10px' }}>간편 로그인</div>
                    <div style={{ flexGrow: 1, height: '1px', backgroundColor: '#eee' }}></div>
                </div>

                {/* 소셜 로그인 버튼 그룹 */}
                <div className="d-grid gap-2">
                    {/* 구글 로그인 */}
                    <button className="btn btn-outline-dark d-flex align-items-center justify-content-center py-2" style={{ fontSize: '15px' }}>
                        <img 
                            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" 
                            alt="Google" 
                            style={{ width: '18px', marginRight: '10px' }} 
                        />
                        Google
                    </button>

                    {/* 카카오 로그인 */}
                    <button className="btn d-flex align-items-center justify-content-center py-2" style={{ backgroundColor: '#FEE500', color: '#000', border: 'none', fontSize: '15px' }}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg" alt="Kakao" style={{ width: '18px', marginRight: '10px' }} />
                        Kakao
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;