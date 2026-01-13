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

    public List<MainImageDTO> getMainBanner() {
        List<MainImage> images = mainImageRepository.findByCategory("main");
        List<MainImageDTO> mainImageDTOList = new ArrayList<MainImageDTO>();

        for(MainImage image : images){
            mainImageDTOList.add(
                new MainImageDTO(
                    image.getId(),
                    image.getImageName(),
                    image.getS3Key(),
                    image.getImageUrl(),
                    image.getCategory()
                )
            );
        }
        return mainImageDTOList;
    }
}
