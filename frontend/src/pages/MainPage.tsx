import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface MainImageDTO {
    id: number;
    imageName: string;
    s3Key: string;
    imageUrl: string;
}

function MainPage() {
    const [banner, setBanner] = useState<MainImageDTO | null>(null);
    const BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        axios.get(`${BASE_URL}/api/main/images/banner`)
            .then(response => {
                const res = response.data; 
                if (res.success) {
                    setBanner(res.data);
                }
                console.log("로딩된 데이터:", res.data);
            })
            .catch(error => {
                console.error("이미지 로드 실패:", error);
            });
    }, [BASE_URL]);

    return (
        <div>
            <Navbar />

            <div className="container">
                {banner ? (
                    <div className='mb-5 position-relative'> {/* 기준점 설정 */}
                        {/* 메인 이미지 */}
                        <img 
                            src={banner.imageUrl}
                            alt={banner.imageName}
                            className="w-100 h-auto"
                            style={{ filter: 'brightness(70%)' }} // 텍스트가 잘 보이도록 이미지 약간 어둡게
                        />

                        {/* 이미지 위 텍스트 영역 */}
                        <div 
                            className="position-absolute top-50 start-0 translate-middle-y ps-5 text-white"
                            style={{ zIndex: 1 }}
                        >
                            <h1 className="display-4 fw-bold">위드유</h1>
                            <p className="fs-4">빈틈없는 피드백 <br/> 1:1 맞춤 교육의 힘</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-5">
                        <p>이미지를 불러오는 중입니다...</p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default MainPage;