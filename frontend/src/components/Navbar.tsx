import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm mb-4">
            <div className="container">
                {/* 로고: 위드유 메인으로 이동 */}
                <Link className="navbar-brand fw-bold text-primary" to="/">위드유</Link>
                
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    {/* 왼쪽 메뉴: 소개, 수업, 시험 */}
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item"><Link className="nav-link" to="/intro">소개</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/class">수업</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/exam">시험</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/notice">공지사항</Link></li>
                    </ul>

                    {/* 오른쪽 메뉴: 로그인 정보 */}
                    <div className="d-flex align-items-center">
                        <Link to="/login" className="btn btn-outline-primary btn-sm me-2">로그인</Link>
                        <Link to="/signup" className="btn btn-primary btn-sm">회원가입</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;