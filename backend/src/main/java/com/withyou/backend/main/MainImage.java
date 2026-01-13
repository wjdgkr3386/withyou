package com.withyou.backend.main;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class MainImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String imageName;

    @Column(unique = true)
    private String s3Key;

    private String imageUrl;

    private String category;

    @Builder
    public MainImage(String imageName, String s3Key, String imageUrl, String category) {
        this.imageName = imageName;
        this.s3Key = s3Key;
        this.imageUrl = imageUrl;
        this.category = category;
    }
}