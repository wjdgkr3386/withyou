package com.withyou.backend.admin.exam.entity;

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
@Table(name = "exams")
public class Exam extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(nullable = false)
    private int questionCount;

    public void updateExam(String title, String content, Integer questionCount) {
        System.out.println("Updating Exam Entity. Content: " + content);
        this.title = title;
        this.content = content;
        this.questionCount = questionCount;
    }
}
