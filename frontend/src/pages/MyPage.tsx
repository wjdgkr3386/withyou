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
  const BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${BASE_URL}/api/mypage`)
      .then(res => {
        setUser(res.data.data);
      })
      .catch(err => {
        console.error("데이터 로딩 실패:", err);
        // 401 에러(Unauthorized)인 경우 로그인 페이지 이동 등의 처리 가능
        if (err.response?.status === 401) {
            alert("로그인이 필요합니다.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [BASE_URL]);

  if (loading) return <div className="text-center py-5">로딩 중...</div>;
  if (!user) return <div className="text-center py-5">사용자 정보를 불러올 수 없습니다.</div>;

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
              <label className="form-label d-flex align-items-center gap-2 text-secondary small">
                <i className="bi bi-person"></i> 이름
              </label>
              <input type="text" className="form-control form-control-lg bg-light border-0 fs-6 text-muted" 
                value={user.name} readOnly />
            </div>

            <div>
              <label className="form-label d-flex align-items-center gap-2 text-secondary small">
                <i className="bi bi-person-badge"></i> 아이디
              </label>
              <input type="text" className="form-control form-control-lg bg-light border-0 fs-6 text-muted" 
                value={user.username} readOnly />
            </div>

            <div>
              <label className="form-label d-flex align-items-center gap-2 text-secondary small">
                <i className="bi bi-calendar-event"></i> 생년월일
              </label>
              <input type="text" className="form-control form-control-lg bg-light border-0 fs-6 text-muted" 
                value={user.birth} readOnly />
            </div>

            <div>
              <label className="form-label d-flex align-items-center gap-2 text-secondary small">
                <i className="bi bi-gender-ambiguous"></i> 성별
              </label>
              <input type="text" className="form-control form-control-lg bg-light border-0 fs-6 text-muted" 
                value={user.gender === 'MALE' ? '남성' : user.gender === 'FEMALE' ? '여성' : '미선택'} readOnly />
            </div>

            <div>
              <label className="form-label d-flex align-items-center gap-2 text-secondary small">
                <i className="bi bi-telephone"></i> 전화번호
              </label>
              <input type="text" className="form-control form-control-lg bg-light border-0 fs-6 text-muted" 
                value={user.phone} readOnly />
            </div>

            <div>
              <label className="form-label d-flex align-items-center gap-2 text-secondary small">
                <i className="bi bi-envelope"></i> 이메일
              </label>
              <input type="email" className="form-control form-control-lg bg-light border-0 fs-6 text-muted" 
                value={user.email || '미등록'} readOnly />
            </div>

            <div>
              <label className="form-label d-flex align-items-center gap-2 text-secondary small">
                <i className="bi bi-mortarboard"></i> 학년도
              </label>
              <input
                type="text"
                className="form-control form-control-lg bg-light border-0 fs-6 text-muted"
                value={gradeMap[user.grade] || '미등록'}
                readOnly
              />
            </div>

            <div>
              <label className="form-label d-flex align-items-center gap-2 text-secondary small">
                <i className="bi bi-mortarboard"></i> 회원 구분
              </label>
              <input type="text" className="form-control form-control-lg bg-light border-0 fs-6 text-muted" 
                value={user.role} readOnly />
            </div>
          </div>
          
          <div className="d-grid gap-2 mt-5">
            <button className="btn btn-dark btn-lg py-3 fw-bold border-0 shadow-none rounded-3 fs-6">프로필 수정</button>
            <div className="d-grid gap-2 mt-2">
              <button
                className="btn btn-outline-danger btn-lg py-3 fw-bold rounded-3 fs-6"
                onClick={handleWithdraw}
              >
                회원탈퇴
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyPage;