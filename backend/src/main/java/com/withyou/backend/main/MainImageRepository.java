package com.withyou.backend.main;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MainImageRepository extends JpaRepository<MainImage, Long> {
    // 카테고리별로 이미지 리스트 조회
    List<MainImage> findByCategory(String category);
}