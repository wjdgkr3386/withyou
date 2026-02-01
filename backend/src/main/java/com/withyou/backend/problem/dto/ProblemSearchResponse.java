package com.withyou.backend.problem.dto;

import com.withyou.backend.account.entity.Grade;
import com.withyou.backend.problem.entity.ProblemDifficulty;
import com.withyou.backend.problem.entity.ProblemOption;
import com.withyou.backend.problem.entity.ProblemType;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ProblemSearchResponse {
    private Long id;
    private Grade grade;
    private String category;
    private String content;
    private ProblemType type;
    private ProblemDifficulty difficulty;
    private String answer;
    private String imageUrl;
    private List<ProblemOption> options = new ArrayList<>();

    public ProblemSearchResponse(Long id, Grade grade, String category, String content, ProblemType type, ProblemDifficulty difficulty, String answer, String imageUrl, List<ProblemOption> options) {
        this.id = id;
        this.grade = grade;
        this.category = category;
        this.content = content;
        this.type = type;
        this.difficulty = difficulty;
        this.answer = answer;
        this.imageUrl = imageUrl;
        this.options = options;
    }
}
