import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';


const AUTH_TIME = 180;
const MAX_FAIL = 5;

function SignupPage() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordCheck, setPasswordCheck] = useState('');
    const [phone1, setPhone1] = useState('');
    const [phone2, setPhone2] = useState('');
    const [phone3, setPhone3] = useState('');
    const [email, setEmail] = useState('');

    const [isCodeSent, setIsCodeSent] = useState(false);
    const [authCode, setAuthCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(AUTH_TIME);
    const [isVerified, setIsVerified] = useState(false);
    const [failCount, setFailCount] = useState(0);

    const navigate = useNavigate();
    const BASE_URL = import.meta.env.VITE_API_URL;

    const phone = phone1 + phone2 + phone3;

    const handlePhoneChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string>>,
        nextId: string | null,
        maxLength: number
    ) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setter(value);
        if (value.length === maxLength && nextId) {
            document.getElementById(nextId)?.focus();
        }
    };

    /* 타이머 */
    useEffect(() => {
        if (!isCodeSent || isVerified) return;

        if (timeLeft <= 0) {
            alert('인증 시간이 만료되었습니다.');
            resetAuth();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isCodeSent, timeLeft, isVerified]);

    const formatTime = (sec: number) =>
        `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

    const sendAuthCode = async () => {
        if (phone.length !== 11) {
            alert('전화번호를 정확히 입력하세요.');
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/api/sms/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });

            if (res.status === 429) {
                alert('인증 요청이 너무 많습니다. 잠시 후 다시 시도하세요.');
                return;
            }

            const result = await res.json();

            if (!res.ok) {
                alert(result.message);
                return;
            }

            alert('인증번호가 전송되었습니다.');
            setIsCodeSent(true);
            setTimeLeft(AUTH_TIME);
            setFailCount(0);

        } catch {
            alert('인증 요청 실패');
        }
    };


    // 전화번호 인증
    const verifyAuthCode = async () => {
        if (failCount >= MAX_FAIL) {
            alert('인증 시도 횟수를 초과했습니다.');
            resetAuth();
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/api/sms/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    phone: phone, 
                    verificationCode: authCode
                }),
            });

            const result = await res.json();

            if (res.ok) {
                setIsVerified(true);
                alert('전화번호 인증 완료');
            } else {
                setFailCount(prev => prev + 1);
                alert(result.message || `인증 실패 (${failCount + 1}/${MAX_FAIL})`);
            }
        } catch {
            alert('인증 확인 중 오류 발생');
        }
    };

    const resetAuth = () => {
        setIsCodeSent(false);
        setAuthCode('');
        setTimeLeft(AUTH_TIME);
        setFailCount(0);
        setIsVerified(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== passwordCheck) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!isVerified) {
            alert('전화번호 인증을 완료해주세요.');
            return;
        }

        const user = {
            name,
            username,
            password,
            phone,
            email: email || null,
        };

        try {
            const res = await fetch(`${BASE_URL}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });

            const result = await res.json();
            if (!res.ok) {
                alert(result.message);
                return;
            }

            alert('회원가입 완료');
            navigate('/login');
        } catch {
            alert('회원가입 실패');
        }
    };

    return (
        <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100 text-center py-5">
            
            {/* 상단 위드유 링크 */}
            <h1>
                <Link className="nav-link mb-4 text-primary fw-bold" to="/">위드유</Link>
            </h1>

            {/* 회원가입 카드 박스 */}
            <div className="card shadow-lg p-4 rounded-4 w-100" style={{ maxWidth: '500px' }}>
                <h3 className="text-center fw-bold mb-4">회원가입</h3>

                <form onSubmit={handleSubmit} className="text-start">
                    {/* 이름 */}
                    <div className="mb-3">
                        <label className="form-label">이름</label>
                        <input className="form-control form-control-lg" value={name}
                            onChange={e => setName(e.target.value)} required />
                    </div>

                    {/* 아이디 */}
                    <div className="mb-3">
                        <label className="form-label">아이디</label>
                        <input className="form-control form-control-lg" value={username}
                            onChange={e => setUsername(e.target.value)} required />
                    </div>

                    {/* 비밀번호 */}
                    <div className="mb-3">
                        <label className="form-label">비밀번호</label>
                        <input type="password" className="form-control form-control-lg"
                            value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    {/* 비밀번호 확인 */}
                    <div className="mb-3">
                        <label className="form-label">비밀번호 확인</label>
                        <input type="password" className="form-control form-control-lg"
                            value={passwordCheck} onChange={e => setPasswordCheck(e.target.value)} required />
                    </div>

                    {/* 전화번호 */}
                    <div className="mb-3">
                        <label className="form-label">전화번호</label>
                        <div className="row g-2 align-items-stretch">
                            <div className="col-3">
                                <input id="phone1" className="form-control form-control-lg px-2 text-center" maxLength={3} value={phone1}
                                    onChange={(e) => handlePhoneChange(e, setPhone1, 'phone2', 3)} readOnly={isVerified} />
                            </div>
                            <div className="col-3">
                                <input id="phone2" className="form-control form-control-lg px-2 text-center" maxLength={4} value={phone2}
                                    onChange={(e) => handlePhoneChange(e, setPhone2, 'phone3', 4)} readOnly={isVerified} />
                            </div>
                            <div className="col-3">
                                <input id="phone3" className="form-control form-control-lg px-2 text-center" maxLength={4} value={phone3}
                                    onChange={(e) => handlePhoneChange(e, setPhone3, null, 4)} readOnly={isVerified} />
                            </div>
                            <div className="col-3 d-grid">
                                <button type="button" className="btn btn-outline-primary btn-sm text-nowrap"
                                    onClick={sendAuthCode} disabled={isVerified}>인증</button>
                            </div>
                        </div>
                    </div>

                    {/* 인증번호 입력란 (활성화 시) */}
                    {isCodeSent && (
                        <div className="mb-3 p-3 bg-light rounded-3">
                            <label className="form-label d-flex justify-content-between">
                                <span>인증번호 입력</span>
                                {!isVerified && <span className="text-danger">남은시간 {formatTime(timeLeft)}</span>}
                            </label>
                            <div className="row g-2">
                                <div className="col-8">
                                    <input className="form-control form-control-lg" maxLength={6} value={authCode}
                                        onChange={(e) => setAuthCode(e.target.value.replace(/[^0-9]/g, ''))}
                                        disabled={isVerified} />
                                </div>
                                <div className="col-4 d-grid">
                                    <button type="button" className="btn btn-primary"
                                        onClick={verifyAuthCode} disabled={isVerified}>확인</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isVerified && <div className="text-success small mb-3">✔ 전화번호 인증이 완료되었습니다.</div>}

                    {/* 이메일 */}
                    <div className="mb-4">
                        <label className="form-label">이메일 (선택)</label>
                        <input type="email" className="form-control form-control-lg"
                            value={email} onChange={e => setEmail(e.target.value)} />
                    </div>

                    <button className="btn btn-primary btn-lg w-100 mb-4">가입하기</button>

                    <div className="text-center">
                        <span className="text-muted small">이미 계정이 있으신가요? </span>
                        <Link to="/login" className="fw-semibold text-decoration-none">
                            로그인
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignupPage;