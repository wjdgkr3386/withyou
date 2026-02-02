package com.withyou.backend.admin.problem.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class ProblemOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int optionNumber;

    @Lob
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    private Problem problem;

    public ProblemOption(Problem problem, int optionNumber, String content) {
        this.problem = problem;
        this.optionNumber = optionNumber;
        this.content = content;
    }
}