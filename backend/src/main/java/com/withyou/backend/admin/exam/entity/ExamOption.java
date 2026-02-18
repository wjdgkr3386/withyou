package com.withyou.backend.admin.exam.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.withyou.backend.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "exam_options")
public class ExamOption extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_problem_id")
    @JsonIgnore
    private ExamProblem problem;

    @Column(nullable = false)
    private int optionOrder;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;
}
