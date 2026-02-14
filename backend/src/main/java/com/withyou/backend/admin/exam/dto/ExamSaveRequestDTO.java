package com.withyou.backend.admin.exam.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ExamSaveRequestDTO {
    private String title;
    private String content; // This content might contain S3 image paths
    private int questionCount;
    private List<Long> problemIds;
}
