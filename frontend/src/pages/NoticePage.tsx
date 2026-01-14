import { Link } from 'react-router-dom';

function NoticePage() {
    const notices = [
        { id: 101, title: "2026학년도 겨울방학 특강 시간표 및 교재 안내", date: "2026-01-10", important: true },
        { id: 102, title: "위드유 수학학원 확장 이전 기념 학부모 설명회 개최", date: "2025-12-20", important: true },
        { id: 103, title: "1월 신정 및 설 연휴 학원 정기 휴무일 안내", date: "2026-01-05", important: false },
        { id: 104, title: "중등부 기말고사 대비 자체 제작 교재 배부", date: "2025-12-28", important: false },
        { id: 105, title: "신규 입학 테스트 일정 및 예약 방법", date: "2025-12-15", important: false },
    ];

    const sortedNotices = [...notices].sort((a, b) => {
        if (a.important === b.important) return 0;
        return a.important ? -1 : 1;
    });

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
                                        <th className="py-3 text-center" style={{ width: '150px' }}>날짜</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {sortedNotices.map((notice) => (
                                        <tr key={notice.id} className="align-middle" style={{ cursor: 'pointer', height: '70px' }}>
                                            {/* 제목 영역: 왼쪽 여백을 충분히 주어 안정감 부여 */}
                                            <td className="ps-5">
                                                <div className="d-flex align-items-center">
                                                    {notice.important && (
                                                        <span className="badge bg-danger me-3 px-2 py-1" style={{ fontSize: '0.75rem' }}>필독</span>
                                                    )}
                                                    <span className={`${notice.important ? 'fw-bold' : ''} text-dark fs-6`}>
                                                        {notice.title}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 날짜 영역 */}
                                            <td className="text-center text-muted small">
                                                {notice.date}
                                            </td>
                                        </tr>
                                    ))}
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

                    <Link to="/Notice/write">
                        <button className="btn btn-primary px-4 py-2 rounded-pill shadow-sm fw-bold">
                            글쓰기
                        </button>
                    </Link>
                    
                </div>
            </div>
        </div>
    );
}

export default NoticePage;