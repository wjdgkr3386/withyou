package com.withyou.backend.mypage.dto;

import com.withyou.backend.account.entity.Grade;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateDTO {
    private String phone;
    private String email;
    private Grade grade;
}
