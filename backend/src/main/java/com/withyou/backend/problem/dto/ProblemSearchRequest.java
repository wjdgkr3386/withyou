package com.withyou.backend.problem.dto;

import com.withyou.backend.account.entity.Grade;
import com.withyou.backend.problem.entity.ProblemDifficulty;
import com.withyou.backend.problem.entity.ProblemType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProblemSearchRequest {
    private Grade grade;
    private String category;
    private ProblemDifficulty difficulty;
    private ProblemType type;
}
