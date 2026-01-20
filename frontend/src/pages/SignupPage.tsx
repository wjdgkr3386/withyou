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
    const [birth, setBirth] = useState('');
    const [gender, setGender] = useState('');

    const [isCodeSent, setIsCodeSent] = useState(false);
    const [authCode, setAuthCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(AUTH_TIME);
    const [isVerified, setIsVerified] = useState(false);
    const [failCount, setFailCount] = useState(0);

    const today = new Date().toISOString().split('T')[0];

    // 한글 또는 영문 2~10자
    const nameRegex = /^[가-힣a-zA-Z]{2,10}$/;
    // 소문자/숫자 5~15자
    const idRegex = /^[a-z0-9]{5,15}$/;
    // 영문+숫자+특수문자 8~20자
    const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phone = phone1 + phone2 + phone3;

    const [errors, setErrors] = useState({
        username: '',
        password: '',
        passwordCheck: '',
        name: '',
        birth: '',
        email: '',
        gender: ''
    });

    const navigate = useNavigate();
    const BASE_URL = import.meta.env.VITE_API_URL;

    // 유효성 검사 로직 통합 함수
    const validateField = (name: string, value: string) => {
        let errorMsg = '';
        switch (name) {
            case 'name':
                if (!value.trim()) { errorMsg = '이름을 입력해주세요.'; }
                else if (!nameRegex.test(value)) { errorMsg = '2~10자 한글 또는 영문만 가능합니다.'; }
                break;
            case 'username':
                if (!idRegex.test(value)) errorMsg = '5~15자 영문 소문자/숫자';
                break;
            case 'password':
                if (!pwRegex.test(value)) errorMsg = '8~20자 영문+숫자+특수문자';
                break;
            case 'passwordCheck':
                if (value !== password) errorMsg = '비밀번호 불일치';
                break;
            case 'email':
                if (value && !emailRegex.test(value)) errorMsg = '이메일 형식 오류';
                break;
            case 'name':
                if (!value.trim()) errorMsg = '이름 필수';
                break;
            case 'birth':
                if (!value) errorMsg = '생년월일 필수';
                break;
            case 'gender':
                if (!value) errorMsg = '성별을 선택해주세요.';
                break;
        }
        setErrors(prev => ({ ...prev, [name]: errorMsg }));
    };



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

    // 비밀번호 변경 시 확인 필드 재검증
    useEffect(() => {
        if (passwordCheck) validateField('passwordCheck', passwordCheck);
    }, [password]);


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

        // 빈 값 체크 (이름, 아이디, 비밀번호, 생년월일, 전화번호)
        if (!name.trim()) return alert('이름을 입력해주세요.');
        if (!username.trim()) return alert('아이디를 입력해주세요.');
        if (!password) return alert('비밀번호를 입력해주세요.');
        if (!birth) return alert('생년월일을 입력해주세요.');

        // 이름 유효성 (힌글/영문 2~10자)
        if (!nameRegex.test(name)) {
            alert('이름 형식이 올바르지 않습니다. (2~10자 한글/영문)');
            return;
        }

        // 아이디 유효성 (영문 소문자, 숫자 조합 5~15자)
        if (!idRegex.test(username)) {
            alert('아이디는 영문 소문자와 숫자를 조합하여 5~15자로 입력해주세요.');
            return;
        }

        // 비밀번호 유효성 (영문+숫자+특수문자 8~20자)
        if (!pwRegex.test(password)) {
            alert('비밀번호는 영문, 숫자, 특수문자를 포함하여 8~20자로 입력해주세요.');
            return;
        }

        // 비밀번호 확인 일치 여부
        if (password !== passwordCheck) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        // 생년월일 체크
        if (birth > today) {
            alert('생년월일은 오늘 이후의 날짜를 선택할 수 없습니다.');
            return;
        }

        // 전화번호 인증 여부 체크
        if (!isVerified) {
            alert('전화번호 인증을 완료해주세요.');
            return;
        }

        // 이메일 형식 체크 (입력했을 경우에만)
        if (email && !emailRegex.test(email)) {
            alert('올바른 이메일 형식이 아닙니다.');
            return;
        }

        const user = {
            name,
            username,
            password,
            phone,
            email: email || null,
            birth: birth,
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
                        <div className="d-flex justify-content-between">
                            <label className="form-label">이름</label>
                            {errors.name && <span className="text-danger small fw-bold">{errors.name}</span>}
                        </div>
                        <input 
                            className={`form-control ${errors.name ? 'is-invalid' : ''}`} 
                            value={name}
                            onChange={e => {
                                const val = e.target.value;
                                setName(val);
                                validateField('name', val); // 실시간 검사 호출
                            }} 
                            required 
                        />
                    </div>

                    {/* 아이디 */}
                    <div className="mb-3">
                        <div className="d-flex justify-content-between">
                            <label className="form-label">아이디</label>
                            {errors.username && <span className="text-danger small">{errors.username}</span>}
                        </div>
                        <input className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                            value={username} onChange={e => { setUsername(e.target.value); validateField('username', e.target.value); }} required />
                    </div>

                    {/* 비밀번호 */}
                    <div className="mb-3">
                        <div className="d-flex justify-content-between">
                            <label className="form-label">비밀번호</label>
                            {errors.password && <span className="text-danger small">{errors.password}</span>}
                        </div>
                        <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                            value={password} onChange={e => { setPassword(e.target.value); validateField('password', e.target.value); }} required />
                    </div>

                    {/* 비밀번호 확인 */}
                    <div className="mb-3">
                        <div className="d-flex justify-content-between">
                            <label className="form-label">비밀번호 확인</label>
                            {errors.passwordCheck && <span className="text-danger small">{errors.passwordCheck}</span>}
                        </div>
                        <input type="password" className={`form-control ${errors.passwordCheck ? 'is-invalid' : ''}`}
                            value={passwordCheck} onChange={e => { setPasswordCheck(e.target.value); validateField('passwordCheck', e.target.value); }} required />
                    </div>

                    {/* 생년월일 */}
                    <div className="mb-3">
                        <div className="d-flex justify-content-between">
                            <label className="form-label">생년월일</label>
                            {errors.birth && <span className="text-danger small">{errors.birth}</span>}
                        </div>
                        <input type="date" className={`form-control ${errors.birth ? 'is-invalid' : ''}`}
                            value={birth} max={today} onChange={e => { setBirth(e.target.value); validateField('birth', e.target.value); }} required />
                    </div>

                    <div className="mb-3">
                        <div className="d-flex justify-content-between">
                            <label className="form-label">성별</label>
                            {errors.gender && <span className="text-danger small fw-bold">{errors.gender}</span>}
                        </div>
                        
                        <div className="d-flex gap-2">
                            {/* 남성 버튼 */}
                            <div className="flex-fill">
                                <input 
                                    type="radio" 
                                    className="btn-check" // Bootstrap 내장 클래스
                                    name="gender" 
                                    id="male" 
                                    value="MALE"
                                    autoComplete="off"
                                    checked={gender === 'MALE'}
                                    onChange={e => { setGender(e.target.value); validateField('gender', e.target.value); }}
                                />
                                <label className="btn btn-outline-primary w-100 py-2 rounded-3" htmlFor="male">
                                    남성
                                </label>
                            </div>
                            
                            {/* 여성 버튼 */}
                            <div className="flex-fill">
                                <input 
                                    type="radio" 
                                    className="btn-check" // Bootstrap 내장 클래스
                                    name="gender" 
                                    id="female" 
                                    value="FEMALE"
                                    autoComplete="off"
                                    checked={gender === 'FEMALE'}
                                    onChange={e => { setGender(e.target.value); validateField('gender', e.target.value); }}
                                />
                                <label className="btn btn-outline-primary w-100 py-2 rounded-3" htmlFor="female">
                                    여성
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 전화번호 */}
                    <div className="mb-3">
                        <label className="form-label">전화번호</label>
                        <div className="row g-2 align-items-stretch">
                            <div className="col-3">
                                <input id="phone1" className="form-control px-2 text-center" maxLength={3} value={phone1}
                                    onChange={(e) => handlePhoneChange(e, setPhone1, 'phone2', 3)} readOnly={isVerified} />
                            </div>
                            <div className="col-3">
                                <input id="phone2" className="form-control px-2 text-center" maxLength={4} value={phone2}
                                    onChange={(e) => handlePhoneChange(e, setPhone2, 'phone3', 4)} readOnly={isVerified} />
                            </div>
                            <div className="col-3">
                                <input id="phone3" className="form-control px-2 text-center" maxLength={4} value={phone3}
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
                                    <input className="form-control" maxLength={6} value={authCode}
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
                        <div className="d-flex justify-content-between">
                            <label className="form-label">이메일 (선택)</label>
                            {errors.email && <span className="text-danger small">{errors.email}</span>}
                        </div>
                        <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            value={email} onChange={e => { setEmail(e.target.value); validateField('email', e.target.value); }} />
                    </div>

                    <button className="btn btn-primary btn-lg w-100 mb-4" 
                        disabled={Object.values(errors).some(x => x !== '') || !isVerified}>
                        가입하기
                    </button>
                </form>
            </div>
        </div>
    );
}

export default SignupPage;