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
    private int questionCount;
    private List<ExamProblemDto> problems;
}
