import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function PasswordChangePage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
        const res = await axios.patch(`${BASE_URL}/api/mypage/password`, {
            currentPassword,
            newPassword
        });

        if (res.data.success) {
            navigate('/login');
        }
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || "비밀번호 변경 실패";
            alert(message);
        } else {
            alert("알 수 없는 오류가 발생했습니다.");
        }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow-sm p-4 rounded-4 w-100" style={{ maxWidth: '400px' }}>
        <h3 className="fw-bold mb-4 text-center">비밀번호 변경</h3>
        <form onSubmit={handlePasswordChange}>
          <div className="mb-3">
            <label className="form-label small">현재 비밀번호</label>
            <input
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label small">새 비밀번호</label>
            <input
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label small">새 비밀번호 확인</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="d-grid gap-2">
            <button type="submit" className="btn btn-primary btn-lg">변경하기</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PasswordChangePage;