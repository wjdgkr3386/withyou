package com.withyou.backend.admin.problem.dto;

import com.withyou.backend.account.entity.Grade;
import com.withyou.backend.admin.problem.entity.ProblemDifficulty;
import com.withyou.backend.admin.problem.entity.ProblemOption;
import com.withyou.backend.admin.problem.entity.ProblemType;
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

    // 페이징 정보 추가
    private long totalCount;    // 전체 문제 개수
    private int currentIndex;   // 현재 문제 번호 (1, 2, 3...)

    public ProblemSearchResponse(Long id, Grade grade, String category, String content,
                                 ProblemType type, ProblemDifficulty difficulty,
                                 String answer, String imageUrl, List<ProblemOption> options,
                                 long totalCount, int currentIndex) {
        this.id = id;
        this.grade = grade;
        this.category = category;
        this.content = content;
        this.type = type;
        this.difficulty = difficulty;
        this.answer = answer;
        this.imageUrl = imageUrl;
        this.options = options;
        this.totalCount = totalCount;
        this.currentIndex = currentIndex;
    }
}
