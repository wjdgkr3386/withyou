package com.withyou.backend.notice.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class NoticeResponseDTO {
    private Long id;
    private String title;
    private String content;
    private Boolean isImportant;
    private List<FileResponseDTO> files;

    @Getter
    @AllArgsConstructor
    public static class FileResponseDTO {
        private String originalName;
        private String fileUrl;
    }
}
