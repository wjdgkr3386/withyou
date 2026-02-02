package com.withyou.backend.admin.problem.entity;

import com.withyou.backend.account.entity.Grade;
import com.withyou.backend.common.entity.BaseEntity;
import com.withyou.backend.admin.problem.dto.ProblemCreateRequest;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor
public class Problem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Grade grade;

    private String category;

    @Lob
    private String content;

    @Enumerated(EnumType.STRING)
    private ProblemType type;

    @Enumerated(EnumType.STRING)
    private ProblemDifficulty difficulty;

    @Lob
    private String answer;

    private String imageUrl;

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProblemOption> options = new ArrayList<>();

    public static Problem create(
            ProblemCreateRequest req,
            String imageUrl
    ) {
        Problem problem = new Problem();
        problem.grade = req.getGrade();
        problem.category = req.getCategory();
        problem.content = req.getContent();
        problem.type = req.getType();
        problem.difficulty = req.getDifficulty();
        problem.answer = req.getAnswer();
        problem.imageUrl = imageUrl;

        if (req.getType() == ProblemType.객관식) {
            for (int i = 0; i < req.getOptions().size(); i++) {
                problem.options.add(
                        new ProblemOption(problem, i + 1, req.getOptions().get(i))
                );
            }
        }

        return problem;
    }

    @Override
    public String toString() {
        return "Problem{" +
                "id=" + id +
                ", grade=" + grade +
                ", category='" + category + '\'' +
                ", content='" + content + '\'' +
                ", type=" + type +
                ", difficulty=" + difficulty +
                ", answer='" + answer + '\'' +
                ", imageUrl='" + imageUrl + '\'' +
                ", options=" + options +
                '}';
    }
}