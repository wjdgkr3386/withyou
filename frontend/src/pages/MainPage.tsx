import mainBanner from '../assets/images/main/mainbanner.png';

function MainPage() {
    return (
        <>
            <div className="container pt-4">
                <div className='position-relative mb-5 overflow-hidden'>
                    
                    {/* 메인 이미지 */}
                    <img 
                        src={mainBanner}
                        alt="학원 메인 배너"
                        className="w-100 h-auto d-block"
                        style={{ 
                            filter: 'brightness(65%)'
                        }}
                    />

                    {/* 텍스트 */}
                    <div 
                        className="position-absolute top-0 start-0 p-4 p-md-5 text-white"
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    >
                        <div className="ps-3 ps-md-4" style={{ borderLeft: '5px solid #007bff' }}> 
                            <h1 className="display-5 display-md-4 fw-bold mb-2">
                                위드유
                            </h1>
                            <p className="fs-6 fs-md-5 lh-base mb-4">
                                모든 학생에게 질문의 기회를,<br/>
                                <strong>1:1 밀착 피드백</strong>으로 확실하게.
                            </p>
                            
                            <div className="mt-3">
                                <button className="btn btn-primary btn-sm btn-md-lg px-4">상담 신청하기</button>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </>
    );
}

export default MainPage;