package com.withyou.backend.notice;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class NoticeResponseDTO {
    private Long id;
    private String title;
    private String content;
    private boolean isImportant;
    private List<FileResponseDTO> files;

    @Getter
    @AllArgsConstructor
    public static class FileResponseDTO {
        private String originalName;
        private String fileUrl;
    }
}
