import React, { useEffect, useRef } from 'react';
import teacherImage from '../assets/images/about/teacher.png';
import class01 from '../assets/images/about/class01.png';
import class02 from '../assets/images/about/class02.png';
import class03 from '../assets/images/about/class03.png';

declare global {
  interface Window {
    google: any;
  }
}

function AboutPage() {
    const mapRef = useRef<HTMLDivElement>(null);

    const academyLocation = { lat: 36.80724843505579, lng: 127.13233229814625 }; 
    const academyName = "위드유 수학학원";
    const academyAddress = "충청남도 천안시 서북구 쌍용동 무정빌딩 3층";

    useEffect(() => {
        if (window.google && window.google.maps) {
            initMap();
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`;
        script.async = true;
        script.defer = true;
        script.onload = () => initMap();
        document.head.appendChild(script);

        function initMap() {
            if (mapRef.current && window.google) {
                const map = new window.google.maps.Map(mapRef.current, {
                    center: academyLocation,
                    zoom: 17,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                });

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 5px; color: #333;">
                            <h6 style="margin-bottom: 5px; font-weight: bold;">${academyName}</h6>
                            <p style="margin: 0; font-size: 13px;">${academyAddress}</p>
                        </div>
                    `,
                });

                const marker = new window.google.maps.Marker({
                    position: academyLocation,
                    map: map,
                    title: academyName,
                });

                marker.addListener("click", () => {
                    infoWindow.open({ anchor: marker, map });
                });
            }
        }
    }, []);

    // 공통 카드 클래스 정의
    const cardClass = "card shadow-sm mb-5 border-0 bg-white overflow-hidden";

    return (
        <div className="bg-light min-vh-100">
            <div className="container py-5">
                {/* Header */}
                <div className="text-center mb-5 mt-3">
                    <h1 className="display-5 fw-bold text-primary">{academyName}</h1>
                    <p className="lead text-secondary">수학 학습 여정을 함께하는 든든한 동반자</p>
                </div>

                {/* 비젼 섹션 */}
                <div className={cardClass}>
                    <div className="card-body p-4 p-md-5">
                        <div className="text-center mb-5 py-4 border-bottom">
                            <p className="fs-4 fs-md-3 fw-bold text-primary mb-0">
                                "수학, 단순 암기가 아닌<br className="d-md-none"/> 논리적 근육을 키우는 도구입니다."
                            </p>
                        </div>
                        <div className="row g-4">
                            {[
                                { title: "1:1 맞춤", desc: "학생의 속도와 수준에 맞춘 최적화 커리큘럼" },
                                { title: "본질 이해", desc: "공식 암기 너머, 깊이 있는 개념 원리 파악" },
                                { title: "자기 주도", desc: "스스로 문제를 해결하는 끈기와 학습 근력 형성" }
                            ].map((item, idx) => (
                                <div key={idx} className="col-12 col-md-6">
                                    <div className="p-4 h-100 rounded-3 border-start border-primary border-5" style={{ backgroundColor: '#f8faff' }}>
                                        <h3 className="h5 fw-bold text-primary mb-2">{item.title}</h3>
                                        <p className="mb-0 text-secondary fw-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center">
                                <span className="text-light fw-bold display-6 opacity-25" style={{ userSelect: 'none' }}>WithYou Math</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 학원 시설 섹션 */}
                <div className={cardClass}>
                    <div className="card-body p-4 p-md-5">
                        <h2 className="text-center fw-bold mb-5 mt-2">학원 시설</h2>
                        <div className="row g-4">
                            {[
                                { img: class01, title: "제 1강의실", desc: "집중력을 높이는 쾌적한 학습 공간" },
                                { img: class02, title: "제 2강의실", desc: "소규모 그룹 수업 및 클리닉 공간" },
                                { img: class03, title: "스터디 존", desc: "자기주도 학습을 위한 몰입형 환경" }
                            ].map((item, idx) => (
                                <div key={idx} className="col-12 col-md-4">
                                    <div className="card h-100 border-0 bg-light shadow-none">
                                        <img src={item.img} className="card-img-top rounded-3" alt={item.title} style={{ height: '220px', objectFit: 'cover' }} />
                                        <div className="card-body text-center">
                                            <h5 className="fw-bold">{item.title}</h5>
                                            <p className="card-text text-muted small mb-0">{item.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 선생님 소개 섹션 */}
                <div className={cardClass}>
                    <div className="card-body p-4 p-md-5">
                        <h2 className="card-title text-center fw-bold mb-5 mt-2">선생님</h2>
                        <div className="row align-items-center">
                            <div className="col-md-4 text-center mb-4 mb-md-0">
                                <img src={teacherImage} alt="Teacher" className="img-fluid rounded-circle shadow-sm mb-3 border border-5 border-white" style={{ maxWidth: '180px' }} />
                                <h4 className="fw-bold text-dark">김은선 선생님</h4>
                            </div>
                            <div className="col-md-8 px-md-4">
                                <div className="p-4 rounded-3 bg-light">
                                    <p className="text-secondary mb-3 leading-relaxed">
                                        위드유 수학학원의 모든 강사진은 풍부한 교육 경험과 전문성을 갖춘 최고의 전문가들입니다. 
                                        학생들과의 소통을 최우선으로 생각하며, 열정적인 지도로 학생들이 목표를 달성할 수 있도록 이끌어줍니다.
                                    </p>
                                    <p className="text-secondary mb-0 leading-relaxed">
                                        각 학생의 눈높이에 맞춰 세심하게 지도하며, 수학의 원리를 쉽고 재미있게 풀어 설명하여 학생들이 수학에 대한 자신감을 가질 수 있도록 돕습니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 학원 위치 섹션 */}
                <div className={cardClass}>
                    <div className="card-body p-4 p-md-5">
                        <h2 className="card-title text-center fw-bold mb-5 mt-2">학원 위치</h2>
                        <div className="row g-4">
                            <div className="col-lg-5">
                                <div className="p-4 rounded-3 h-100" style={{ backgroundColor: '#f8faff' }}>
                                    <h3 className="h5 fw-bold mb-4 border-bottom pb-2">찾아오시는 길</h3>
                                    <ul className="list-unstyled mb-4">
                                        <li className="mb-3"><strong>주소:</strong> {academyAddress}</li>
                                        <li className="mb-3"><strong>대표번호:</strong> 010-1234-5678</li>
                                        <li className="mb-3"><strong>이메일:</strong> test@withyou.com</li>
                                    </ul>
                                    <div className="pt-2">
                                        <span className="badge bg-primary px-3 py-2 me-2">버스</span>
                                        <span className="text-secondary small fw-bold">2, 6, 7, 12, 20, 30, 31, 62, 92, 94, 97, 910</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-7">
                                <div ref={mapRef} className="rounded-3 border" style={{ height: '400px', width: '100%', backgroundColor: '#eee' }} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AboutPage;