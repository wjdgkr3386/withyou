function Footer() {
    return (
        <footer className="bg-dark text-light py-5 mt-auto">
            <div className="container">
                <div className="row">
                    {/* 학원 정보 */}
                    <div className="col-md-4 mb-4">
                        <h5 className="fw-bold mb-3">위드유 수학학원</h5>
                        <p className="small mb-1">주소: 충청남도 천안시 서북구 쌍용동 무정빌딩 3층</p>
                        <p className="small mb-1">대표번호: 010-8924-7050</p>
                        <p className="small">이메일: contact@withyou.com</p>
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