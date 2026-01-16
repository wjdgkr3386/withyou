package com.withyou.backend.notice;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class NoticeWriteDTO {
    private String title;
    private String content;
    private boolean isImportant;
}
