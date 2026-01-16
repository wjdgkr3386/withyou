package com.withyou.backend.notice;

import jakarta.persistence.*;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Table(name = "notice")
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;

    @Column(length = 100, nullable = false, comment = "공지사항 제목")
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT", comment = "공지사항 내용")
    private String content;

    @Column(nullable = false, comment = "중요 공지 여부")
    private Boolean isImportant;

    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NoticeFile> files = new ArrayList<>();

    public Notice() {}
    public Notice(String title, String content, Boolean isImportant) {
        this.title = title;
        this.content = content;
        this.isImportant = isImportant;
    }

    public void addFile(NoticeFile file) {
        this.files.add(file);
        file.setNotice(this);
    }

}
