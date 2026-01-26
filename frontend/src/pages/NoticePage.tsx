import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function NoticePage() {
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();
    const BASE_URL = import.meta.env.VITE_API_URL;

    // 서버 데이터 호출
    useEffect(() => {
        // BASE_URL을 사용하여 API 호출
        axios.get(`${BASE_URL}/api/notice/list`)
            .then(response => {
                if (response.data.success) {
                    setNotices(response.data.data);
                }
            })
            .catch(error => {
                console.error("공지사항 조회 실패:", error);
                alert("데이터를 불러오는 중 오류가 발생했습니다.");
            })
            .finally(() => setLoading(false));
    }, []);

    // 중요 공지사항 우선 정렬 + 최신순
    const sortedNotices = [...notices].sort((a, b) => {
        if (a.isImportant !== b.isImportant) {
            return a.isImportant ? -1 : 1;
        }
        if (b.id > a.id) return 1;
        if (b.id < a.id) return -1;
        return 0;
    });

    if (loading) return <div className="text-center py-5">로딩 중...</div>;

    return (
        <div className="bg-light min-vh-100 py-5">
            <div className="container">
                {/* 헤더 섹션 */}
                <div className="text-center mb-5">
                    <h1 className="display-5 fw-bold text-primary">공지사항</h1>
                    <p className="lead text-secondary">위드유의 새로운 소식을 확인해 보세요.</p>
                </div>

                {/* 게시판 카드 */}
                <div className="card shadow-sm border-0 bg-white overflow-hidden">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-primary text-white">
                                    <tr>
                                        <th className="py-3 ps-5 text-start">제목</th>
                                        <th className="py-3 text-center" style={{ width: '150px' }}>첨부파일</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {sortedNotices.length > 0 ? (
                                        sortedNotices.map((notice) => (
                                            <tr 
                                                key={notice.id} 
                                                className="align-middle" 
                                                style={{ cursor: 'pointer', height: '70px' }}
                                                onClick={() => navigate(`/notice/detail/${notice.id}`)}
                                            >
                                                <td className="ps-5">
                                                    <div className="d-flex align-items-center">
                                                        {notice.isImportant && (
                                                            <span className="badge bg-danger me-3 px-2 py-1" style={{ fontSize: '0.75rem' }}>
                                                                필독
                                                            </span>
                                                        )}
                                                        <span className={`${notice.isImportant ? 'fw-bold' : ''} text-dark fs-6`}>
                                                            {notice.isImportant && '[필수] '}
                                                            {notice.title}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    {/* 첨부파일 개수 표시 */}
                                                    {notice.files && notice.files.length > 0 && (
                                                        <span className="text-muted small">
                                                            <i className="bi bi-paperclip"></i> {notice.files.length}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="text-center py-5 text-muted">등록된 공지사항이 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 하단 컨트롤 영역 */}
                <div className="d-flex justify-content-between align-items-center mt-4 px-2">
                    <div className="input-group shadow-sm" style={{ maxWidth: '350px' }}>
                        <input 
                            type="text" 
                            className="form-control border-0 ps-3" 
                            placeholder="찾으시는 내용을 입력하세요" 
                        />
                        <button className="btn btn-primary px-4">검색</button>
                    </div>

                    {user?.role === 'ADMIN' && (
                        <Link to="/notice/write">
                            <button className="btn btn-primary px-4 py-2 rounded-pill shadow-sm fw-bold">
                                글쓰기
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NoticePage;