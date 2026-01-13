package com.withyou.backend.main;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MainImageDTO {

    private Long id;

    private String imageName;

    private String s3Key;

    private String imageUrl;

    private String category;

    public MainImageDTO(Long id, String imageName, String s3Key, String imageUrl, String category) {
        this.id = id;
        this.imageName = imageName;
        this.s3Key = s3Key;
        this.imageUrl = imageUrl;
        this.category = category;
    }
}
