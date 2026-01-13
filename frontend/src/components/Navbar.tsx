import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm mb-4">
            <div className="container">
                {/* 브랜드 로고 */}
                <Link className="navbar-brand fw-bold text-primary" to="/">위드유</Link>

                {/* 햄버거 버튼 */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* 메뉴 영역 */}
                <div className="collapse navbar-collapse mt-2 mt-lg-0" id="navbarNav">
                    {/* flex-lg-grow-1: PC에서 메뉴바가 남는 공간을 다 차지함
                        justify-content-lg-evenly: PC에서 메뉴들이 일정한 비율로 벌어짐
                        align-items-end: 모바일에서 오른쪽 정렬
                    */}
                    <ul className="navbar-nav flex-lg-grow-1 justify-content-lg-evenly align-items-end align-items-lg-center px-lg-5">
                        <li className="nav-item"><Link className="nav-link" to="/about">소개</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/class">수업</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/exam">시험</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/notice">공지사항</Link></li>
                    </ul>

                    {/* 로그인/회원가입 버튼 (오른쪽 끝 고정) */}
                    <div className="d-flex gap-2 justify-content-end mt-2 mt-lg-0">
                        <Link to="/login" className="btn btn-outline-primary btn-sm">로그인</Link>
                        <Link to="/signup" className="btn btn-primary btn-sm">회원가입</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;