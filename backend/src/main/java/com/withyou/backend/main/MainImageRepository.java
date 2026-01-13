package com.withyou.backend.main;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MainImageRepository extends JpaRepository<MainImage, Long> {
    // 이미지 이름으로 조회
    MainImage findByImageName(String imageName);
}