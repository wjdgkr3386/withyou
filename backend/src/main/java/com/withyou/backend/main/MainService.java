package com.withyou.backend.main;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MainService {

    private final MainImageRepository mainImageRepository;

    public MainService(MainImageRepository mainImageRepository){
        this.mainImageRepository = mainImageRepository;
    }

    // 메인 배너 이미지 조회
    public MainImageDTO getMainBanner() {
        MainImage image = mainImageRepository.findByImageName("메인배너");

        return new MainImageDTO(
                image.getId(),
                image.getImageName(),
                image.getS3Key(),
                image.getImageUrl()
        );
    }
}
