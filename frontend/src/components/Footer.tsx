import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer className="bg-dark text-light py-5 mt-auto">
            <div className="container">
                <div className="row">
                    {/* 학원 정보 */}
                    <div className="col-md-4 mb-4">
                        <h5 className="fw-bold mb-3">위드유 수학학원</h5>
                        <p className="small mb-1">주소: 충남 천안시 서북구 어딘가</p>
                        <p className="small mb-1">대표번호: 010-1234-5678</p>
                        <p className="small">이메일: contact@withyou.com</p>
                    </div>

                    {/* 빠른 링크 (화면정의서 기반) */}
                    <div className="col-md-4 mb-4">
                        <h5 className="fw-bold mb-3">바로가기</h5>
                        <ul className="list-unstyled small">
                            <li className="mb-2"><Link to="/intro" className="text-light text-decoration-none">학원 소개</Link></li>
                            <li className="mb-2"><Link to="/class" className="text-light text-decoration-none">수업 안내</Link></li>
                            <li className="mb-2"><Link to="/notice" className="text-light text-decoration-none">공지사항</Link></li>
                        </ul>
                    </div>

                    {/* 이용 약관 */}
                    <div className="col-md-4 mb-4">
                        <h5 className="fw-bold mb-3">고객지원</h5>
                        <ul className="list-unstyled small">
                            <li className="mb-2"><a href="#!" className="text-light text-decoration-none">개인정보처리방침</a></li>
                            <li className="mb-2"><a href="#!" className="text-light text-decoration-none">이용약관</a></li>
                        </ul>
                    </div>
                </div>

                <hr className="bg-light" />

                <div className="text-center small text-secondary mt-3">
                    © 2026 WithYou Math Academy. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

export default Footer;