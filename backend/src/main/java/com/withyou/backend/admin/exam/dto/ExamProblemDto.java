package com.withyou.backend.admin.exam.dto;

import lombok.Data;
import java.util.List;

@Data
public class ExamProblemDto {
    private Integer problemOrder;
    private String grade;
    private String category;
    private String content;
    private String type;
    private String difficulty;
    private String answer;
    private List<OptionDto> options;
    private Boolean hasImage;
    private String imageUrl;
    private Integer timeLimit;

    @Data
    public static class OptionDto {
        private Integer optionNumber;
        private String content;
    }

    public void setImageUrl(String imageUrl){
        this.imageUrl = imageUrl;
    }
}