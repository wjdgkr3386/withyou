package com.withyou.backend.notice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "notice_file")
public class NoticeFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String originalName; // 사용자가 올린 파일명 (예: 프로젝트_기획서.pdf)

    @Column(nullable = false, length = 500)
    private String fileUrl;      // S3 실제 경로

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id")
    private Notice notice;

    public NoticeFile(String originalName, String fileUrl, Notice notice) {
        this.originalName = originalName;
        this.fileUrl = fileUrl;
        this.notice = notice;
    }

    // 양방향 매핑용
    public void setNotice(Notice notice) {
        this.notice = notice;
    }
}