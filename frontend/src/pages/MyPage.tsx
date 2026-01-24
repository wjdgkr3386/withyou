import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface MyPageInfo {
  id: number;
  name: string;
  username: string;
  phone: string;
  email: string;
  birth: string;
  gender: string;
  role: string;
  grade: string;
}

function MyPage() {
  const [user, setUser] = useState<MyPageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEdit, setIsEdit] = useState(false);
  const [editUser, setEditUser] = useState<MyPageInfo | null>(null);

  const BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${BASE_URL}/api/mypage`)
      .then(res => {
        setUser(res.data.data);
      })
      .catch(err => {
        console.error("데이터 로딩 실패:", err);
        if (err.response?.status === 401) {
          alert("로그인이 필요합니다.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [BASE_URL]);

  if (loading) return <div className="text-center py-5">로딩 중...</div>;
  if (!user) { window.location.href = '/login'; return null; }

  const gradeMap: Record<string, string> = {
    E1: '초등학교 1학년',
    E2: '초등학교 2학년',
    E3: '초등학교 3학년',
    E4: '초등학교 4학년',
    E5: '초등학교 5학년',
    E6: '초등학교 6학년',
    M1: '중학교 1학년',
    M2: '중학교 2학년',
    M3: '중학교 3학년',
    H1: '고등학교 1학년',
    H2: '고등학교 2학년',
    H3: '고등학교 3학년',
    ADULT: '성인'
  };

  const handleEdit = () => {
    setEditUser(user);
    setIsEdit(true);
  };

  const handleCancel = () => {
    setEditUser(null);
    setIsEdit(false);
  };

  const handleSave = async () => {
    if (!editUser) return;

    try {
      await axios.patch(`${BASE_URL}/api/mypage/profile`, {
        phone: editUser.phone,
        email: editUser.email,
        grade: editUser.grade,
      });

      setUser(editUser);
      setIsEdit(false);
      alert('프로필이 수정되었습니다.');
    } catch (err) {
      alert('프로필 수정 실패');
      console.error(err);
    }
  };

  // 계정 탈퇴
  const handleWithdraw = async () => {
    const input = window.prompt(
      '회원 탈퇴를 진행하려면 아래 문구를 정확히 입력하세요.\n\n회원 탈퇴'
    );

    if (input !== '회원 탈퇴') {
      alert('문구가 정확하지 않습니다. 회원 탈퇴가 취소되었습니다.');
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/api/users/me`);
      alert('회원탈퇴가 완료되었습니다.');
      window.location.href = '/';
    } catch (err) {
      alert('회원탈퇴 실패');
      console.error(err);
    }
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="mb-4 text-center">
          <h2 className="fw-bold mb-1">마이페이지</h2>
        </div>

        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
          <h4 className="fw-bold mb-1">내 정보</h4>
          <p className="text-muted small mb-4">회원 정보를 관리할 수 있습니다.</p>

          <div className="d-flex flex-column gap-4">
            <div>
              <label className="form-label small">이름</label>
              <input className="form-control bg-light" value={user.name} readOnly />
            </div>

            <div>
              <label className="form-label small">아이디</label>
              <input className="form-control bg-light" value={user.username} readOnly />
            </div>

            <div>
              <label className="form-label small">생년월일</label>
              <input className="form-control bg-light" value={user.birth} readOnly />
            </div>

            <div>
              <label className="form-label small">성별</label>
              <input
                className="form-control bg-light"
                value={user.gender === 'MALE' ? '남성' : user.gender === 'FEMALE' ? '여성' : '미선택'}
                readOnly
              />
            </div>

            <div>
              <label className="form-label small">전화번호</label>
              <input
                className="form-control"
                value={isEdit ? editUser?.phone ?? '' : user.phone}
                readOnly={!isEdit}
                onChange={(e) =>
                  setEditUser(prev => prev && { ...prev, phone: e.target.value })
                }
              />
            </div>

            <div>
              <label className="form-label small">이메일</label>
              <input
                className="form-control"
                value={isEdit ? editUser?.email ?? '' : user.email}
                readOnly={!isEdit}
                onChange={(e) =>
                  setEditUser(prev => prev && { ...prev, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="form-label small">학년도</label>
              {!isEdit ? (
                <input
                  className="form-control bg-light"
                  value={gradeMap[user.grade] || '미등록'}
                  readOnly
                />
              ) : (
                <select
                  className="form-select"
                  value={editUser?.grade ?? ''}
                  onChange={(e) =>
                    setEditUser(prev => prev && { ...prev, grade: e.target.value })
                  }
                >
                  {Object.entries(gradeMap).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="form-label small">회원 구분</label>
              <input className="form-control bg-light" value={user.role} readOnly />
            </div>
          </div>

          <div className="d-grid gap-2 mt-5">
            {!isEdit ? (
              <button className="btn btn-dark btn-lg" onClick={handleEdit}>
                프로필 수정
              </button>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" onClick={handleSave}>
                  저장
                </button>
                <button className="btn btn-outline-secondary btn-lg" onClick={handleCancel}>
                  취소
                </button>
              </>
            )}

            <button
              className="btn btn-outline-danger btn-lg mt-2"
              onClick={handleWithdraw}
            >
              회원탈퇴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyPage;
