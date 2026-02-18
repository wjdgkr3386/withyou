package com.withyou.backend.admin.exam.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExamResponseDTO {
    private Long id;
    private String title;
    private int questionCount;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private List<ExamProblemDto> problems;
}
