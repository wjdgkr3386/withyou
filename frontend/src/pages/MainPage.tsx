import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface MainImageDTO {
    id: number;
    imageName: string;
    s3Key: string;
    imageUrl: string;
    category: string;
}

function MainPage() {
    const [banners, setBanners] = useState<MainImageDTO[]>([]);
    const BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        console.log("BASE_URL:", BASE_URL);
        axios.get(`${BASE_URL}/api/main/images/banner`)
            .then(response => {
                if (response.data.success) {
                    setBanners(response.data.data);
                }
                console.log(response.data.data);
            })
            .catch(error => {
                console.error("이미지 로드 실패:", error);
            });
    }, []);

    return (
        <div>
            <Navbar />

            <div className="container">
                {banners.length > 0 ? (
                    banners.map((banner) => (
                        <div key={banner.id} className='mb-5'>
                            <img 
                                src={banner.imageUrl}
                                alt={banner.imageName}
                                className="w-100 h-auto"
                            />
                        </div>
                    ))
                ) : (
                    <p>이미지를 불러오는 중입니다...</p>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default MainPage;