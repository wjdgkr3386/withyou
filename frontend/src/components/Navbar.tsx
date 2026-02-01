import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import React from 'react';

function Navbar() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    // 로그아웃
    const handleLogout = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/logout`, {}, { withCredentials: true });
            setUser(null);
            alert("로그아웃 되었습니다.");
            navigate('/');
        } catch (error) {
            console.error("로그아웃 실패:", error);
        }
    };

    // 네비바 선택한 요소 표시
    const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
        color: isActive ? 'var(--bs-primary)' : 'inherit',
        borderBottom: isActive ? '2px solid var(--bs-primary)' : 'none',
        fontWeight: isActive ? 'bold' : 'normal'
    });

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
            <div className="container">
                {/* 로고 */}
                <NavLink className="navbar-brand fw-bold text-primary fs-4" to="/">위드유</NavLink>

                {/* 햄버거 버튼 */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* 네비바 요소 */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav mx-auto gap-lg-5 text-center">
                        <li className="nav-item">
                            <NavLink className="nav-link px-3" style={navLinkStyle} to="/about">소개</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link px-3" style={navLinkStyle} to="/class">수업</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link px-3" style={navLinkStyle} to="/exam">시험</NavLink>
                        </li>
                        {user?.role === 'ADMIN' && (
                            <li className="nav-item">
                                <NavLink className="nav-link px-3" style={navLinkStyle} to="/problembank">
                                    문제은행
                                </NavLink>
                            </li>
                        )}
                        <li className="nav-item">
                            <NavLink className="nav-link px-3" style={navLinkStyle} to="/notice">공지사항</NavLink>
                        </li>
                    </ul>

                    {/* 로그인/로그아웃 */}
                    <div className="d-flex gap-2 align-items-center justify-content-center mt-3 mt-lg-0">
                        {user ? (
                            <>
                                <NavLink 
                                    to="/mypage" 
                                    className="text-decoration-none text-dark fw-bold me-2"
                                    style={({ isActive }) => ({ color: isActive ? 'var(--bs-primary)' : 'inherit' })}
                                >
                                    {user.username}님
                                </NavLink>
                                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3">로그아웃</button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className="btn btn-outline-primary btn-sm rounded-pill px-3">로그인</NavLink>
                                <NavLink to="/signup" className="btn btn-primary btn-sm rounded-pill px-3 text-white">회원가입</NavLink>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;