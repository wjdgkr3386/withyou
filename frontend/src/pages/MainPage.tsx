import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function MainPage() {
    return (
        <div>
            <Navbar />

            <main className="container">

                {/* 학원 이미지 섹션 */}
                <div className="row mb-5">
                    <div className="col-12">
                        <div className="bg-secondary text-white text-center py-5 rounded" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <h2>학원 홍보 및 메인 이미지 영역</h2>
                        </div>
                    </div>
                </div>

                {/* 공지사항 및 퀵 메뉴 영역 */}
                <div className="row">
                    <div className="col-md-8">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fw-bold">최근 공지사항</h4>
                            <button className="btn btn-sm btn-link text-decoration-none text-muted">더보기</button>
                        </div>
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                [공지] 2026년 겨울방학 특강 안내
                                <span className="text-muted small">2026-01-06</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                [안내] 위드유 웹사이트 오픈 이벤트
                                <span className="text-muted small">2026-01-05</span>
                            </li>
                        </ul>
                    </div>
                    
                    {/* 마이페이지나 퀵 버튼 영역 */}
                    <div className="col-md-4">
                        <div className="card border-0 bg-light p-3">
                            <h5 className="fw-bold mb-3">학생 서비스</h5>
                            <button className="btn btn-white shadow-sm mb-2 w-100 py-3">내 성적 확인</button>
                            <button className="btn btn-white shadow-sm w-100 py-3">문제 은행 바로가기</button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default MainPage;