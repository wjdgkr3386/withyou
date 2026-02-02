package com.withyou.backend.admin.subject.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "subjects")
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String grade;    // 예: 중2
    private String term;     // 예: 1학기
    private String content;  // 예: 1. 유리수와 순환소수
    private Integer sortOrder; // 정렬 순서
}