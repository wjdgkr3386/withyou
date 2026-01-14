package com.withyou.backend.notice;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class Notice {
    private String title;
    private String content;
    private Boolean isImportant;
}
