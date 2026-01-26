package com.withyou.backend.notice.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class NoticeWriteDTO {
    private String title;
    private String content;
    private Boolean isImportant;
    private List<MultipartFile> files;
}
