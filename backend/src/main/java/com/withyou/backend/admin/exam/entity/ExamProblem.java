package com.withyou.backend.admin.exam.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.withyou.backend.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "exam_problems")
public class ExamProblem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id")
    @JsonIgnore
    private Exam exam;

    @Column(nullable = false)
    private int problemOrder;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Lob
    private String answer;

    private String grade;

    private String category;

    private String imageUrl;

    private String difficulty;

    private String questionType;

    @Column(nullable = false)
    @Builder.Default
    private int timeLimit = 0;

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExamOption> options = new ArrayList<>();
}
