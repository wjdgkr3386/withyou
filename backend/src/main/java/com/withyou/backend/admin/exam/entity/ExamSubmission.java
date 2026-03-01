package com.withyou.backend.admin.exam.entity;

import com.withyou.backend.account.entity.User;
import com.withyou.backend.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "exam_submissions")
public class ExamSubmission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id")
    private Exam exam;

    @Column(nullable = false)
    private int problemOrder;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String submittedAnswer;

    @Column(nullable = false)
    @Builder.Default
    private boolean isCorrect = false;

    @Column(nullable = true)
    private String sessionId;
}
