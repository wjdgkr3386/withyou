import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

function AccountFindPage() {
    const BASE_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    // 아이디 찾기 상태
    const [findIdForm, setFindIdForm] = useState({
        name: '',
        phone: ''
    });
    const [foundId, setFoundId] = useState('');

    // 비밀번호 찾기 상태
    const [findPwForm, setFindPwForm] = useState({
        name: '',
        username: '',
        phone: '',
        verificationCode: ''
    });
    const [isVerificationSent, setIsVerificationSent] = useState(false);

    // 아이디 찾기 핸들러
    const handleFindId = async () => {
        if (!findIdForm.name || !findIdForm.phone) {
            alert('이름과 휴대폰 번호를 입력해주세요.');
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/api/find/username`, {
                name: findIdForm.name,
                phone: findIdForm.phone
            });

            if (response.data.success) {
                setFoundId(response.data.data);
            } else {
                alert(response.data.message || '일치하는 회원 정보를 찾을 수 없습니다.');
            }
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert(err.response?.data?.message || "아이디 찾기 중 오류가 발생했습니다.");   
        }
    };

    // 인증번호 요청 핸들러
    const handleRequestVerification = async () => {
        if (!findPwForm.phone) {
            alert('휴대폰 번호를 입력해주세요.');
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/api/send-verification`, {
                phone: findPwForm.phone
            });

            if (response.data.success) {
                setIsVerificationSent(true);
                alert('인증번호가 발송되었습니다.');
            } else {
                alert(response.data.message || '인증번호 발송에 실패했습니다.');
            }
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            if (err.response?.status === 429) {
                alert("인증번호 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
            } else {
                alert(err.response?.data?.message || "인증번호 발송 중 오류가 발생했습니다.");
            }
        }
    };

    // 비밀번호 찾기 핸들러
    const handleFindPassword = async () => {
        if (!findPwForm.name || !findPwForm.username || !findPwForm.phone || !findPwForm.verificationCode) {
            alert('모든 항목을 입력해주세요.');
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/api/find/password`, {
                name: findPwForm.name,
                username: findPwForm.username,
                phone: findPwForm.phone,
                verificationCode: findPwForm.verificationCode
            });

            if (response.data.success) {
                alert('임시 비밀번호가 발송되었습니다. 로그인 후 비밀번호를 변경해주세요.');
                navigate('/login');
            } else {
                alert(response.data.message || '비밀번호 찾기에 실패했습니다.');
            }
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert(err.response?.data?.message || "비밀번호 찾기 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="w-100" style={{ maxWidth: '960px' }}>

                <h3 className="text-center fw-bold mb-4">계정 찾기</h3>

                <div className="row g-4">
                    
                    {/* ================= 아이디 찾기 카드 ================= */}
                    <div className="col-12 col-md-6">
                        <div className="card shadow-lg p-4 rounded-4 h-100">
                            <h5 className="fw-bold mb-3 text-center">아이디 찾기</h5>

                            <div className="mb-3">
                                <label className="form-label">이름</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="이름 입력"
                                    value={findIdForm.name}
                                    onChange={(e) => setFindIdForm({...findIdForm, name: e.target.value})}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label">휴대폰 번호</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="01012345678"
                                    value={findIdForm.phone}
                                    onChange={(e) => setFindIdForm({...findIdForm, phone: e.target.value})}
                                />
                            </div>

                            {foundId && (
                                <div className="alert alert-success mb-3">
                                    찾은 아이디: <strong>{foundId}</strong>
                                </div>
                            )}

                            <button 
                                className="btn btn-primary w-100 mt-auto"
                                onClick={handleFindId}
                            >
                                아이디 찾기
                            </button>
                        </div>
                    </div>

                    {/* ================= 비밀번호 찾기 카드 ================= */}
                    <div className="col-12 col-md-6">
                        <div className="card shadow-lg p-4 rounded-4 h-100">
                            <h5 className="fw-bold mb-3 text-center">비밀번호 찾기</h5>

                            <div className="mb-3">
                                <label className="form-label">이름</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="이름 입력"
                                    value={findPwForm.name}
                                    onChange={(e) => setFindPwForm({...findPwForm, name: e.target.value})}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">아이디</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="아이디 입력"
                                    value={findPwForm.username}
                                    onChange={(e) => setFindPwForm({...findPwForm, username: e.target.value})}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">휴대폰 번호</label>
                                <div className="d-flex gap-2">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="01012345678"
                                        value={findPwForm.phone}
                                        onChange={(e) => setFindPwForm({...findPwForm, phone: e.target.value})}
                                    />
                                    <button 
                                        className="btn btn-outline-primary text-nowrap"
                                        onClick={handleRequestVerification}
                                    >
                                        인증요청
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label">인증번호</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="인증번호 입력"
                                    value={findPwForm.verificationCode}
                                    onChange={(e) => setFindPwForm({...findPwForm, verificationCode: e.target.value})}
                                    disabled={!isVerificationSent}
                                />
                            </div>

                            <button 
                                className="btn btn-primary w-100 mt-auto"
                                onClick={handleFindPassword}
                            >
                                비밀번호 찾기
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default AccountFindPage;