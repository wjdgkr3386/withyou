import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';

function SignupPage() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordCheck, setPasswordCheck] = useState('');
    const [phone1, setPhone1] = useState('');
    const [phone2, setPhone2] = useState('');
    const [phone3, setPhone3] = useState('');
    const [email, setEmail] = useState('');

    const BASE_URL = import.meta.env.VITE_API_URL;

    // 전화번호 입력 및 자동 포커스 이동 핸들러
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== passwordCheck) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        const user = {
            name,
            username,
            password,
            phone: phone1 + phone2 + phone3,
            email: email || null,
        };

        try {
            const response = await fetch(`${BASE_URL}/api/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert('회원가입 실패: ' + (errorData.message || '오류 발생'));
                return;
            }

            const data = await response.json();
            alert('회원가입 성공! 아이디: ' + data.username);
        } catch (error) {
            console.error(error);
            alert('서버 오류가 발생했습니다.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="container mt-5" style={{ maxWidth: '500px' }}>
            <h1 className="text-center mb-5">회원가입</h1>

            {/* 이름 */}
            <div className="mb-3">
                <label htmlFor="name" className="form-label">이름</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            {/* 아이디 */}
            <div className="mb-3">
                <label htmlFor="username" className="form-label">아이디</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>

            {/* 비밀번호 */}
            <div className="mb-3">
                <label htmlFor="password" className="form-label">비밀번호</label>
                <input
                    type="password"
                    className="form-control form-control-lg"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            {/* 비밀번호 확인 */}
            <div className="mb-3">
                <label htmlFor="passwordCheck" className="form-label">비밀번호 확인</label>
                <input
                    type="password"
                    className="form-control form-control-lg"
                    id="passwordCheck"
                    value={passwordCheck}
                    onChange={(e) => setPasswordCheck(e.target.value)}
                    required
                />
            </div>

            {/* 전화번호 */}
            <div className="mb-4">
                <label className="form-label">전화번호</label>
                <div className="row g-3">
                    <div className="col-4">
                        <input
                            type="tel"
                            className="form-control form-control-lg"
                            id="phone1"
                            placeholder="010"
                            maxLength={3}
                            value={phone1}
                            onChange={(e) => handlePhoneChange(e, setPhone1, 'phone2', 3)}
                            required
                        />
                    </div>
                    <div className="col-4">
                        <input
                            type="tel"
                            className="form-control form-control-lg"
                            id="phone2"
                            placeholder="1234"
                            maxLength={4}
                            value={phone2}
                            onChange={(e) => handlePhoneChange(e, setPhone2, 'phone3', 4)}
                            required
                        />
                    </div>
                    <div className="col-4">
                        <input
                            type="tel"
                            className="form-control form-control-lg"
                            id="phone3"
                            placeholder="5678"
                            maxLength={4}
                            value={phone3}
                            onChange={(e) => handlePhoneChange(e, setPhone3, null, 4)}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* 이메일 */}
            <div className="mb-3">
                <label htmlFor="email" className="form-label">이메일 (선택)</label>
                <input
                    type="email"
                    className="form-control form-control-lg"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <button className="btn btn-primary btn-lg w-100" type="submit">
                회원가입
            </button>
        </form>
    );
}

export default SignupPage;