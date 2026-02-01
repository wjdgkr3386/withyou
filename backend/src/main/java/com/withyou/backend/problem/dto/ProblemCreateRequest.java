package com.withyou.backend.problem.dto;

import com.withyou.backend.account.entity.Grade;
import com.withyou.backend.problem.entity.ProblemDifficulty;
import com.withyou.backend.problem.entity.ProblemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ProblemCreateRequest {

    @NotNull
    private Grade grade;                 // E1, E2 ...

    @NotBlank
    private String category;             // 수와 연산, 함수 등

    @NotBlank
    private String content;              // 문제 본문 (LaTeX 포함)

    @NotNull
    private ProblemType type;            // 객관식 / 주관식 / 빈칸

    @NotNull
    private ProblemDifficulty difficulty; // 하 / 중 / 상

    private List<String> options;        // 객관식일 때만 사용

    @NotBlank
    private String answer;               // 정답
}
