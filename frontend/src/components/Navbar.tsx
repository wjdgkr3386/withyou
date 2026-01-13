import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Navbar() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

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

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm mb-4">
            <div className="container">
                <Link className="navbar-brand fw-bold text-primary" to="/">위드유</Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse mt-2" id="navbarNav">
                    <ul className="navbar-nav me-auto text-start gap-5 mx-5">
                        <li className="nav-item"><Link className="nav-link" to="/about">소개</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/class">수업</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/exam">시험</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/notice">공지사항</Link></li>
                    </ul>

                    <div className="d-flex gap-3 align-items-center">
                        {user ? (
                            <>
                                <span className="text-dark fw-bold">{user}님</span>
                                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">로그아웃</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-outline-primary btn-sm">로그인</Link>
                                <Link to="/signup" className="btn btn-primary btn-sm">회원가입</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;