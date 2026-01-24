package com.withyou.backend.account.dto;

import com.withyou.backend.account.entity.Grade;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupDTO {

    private String name;
    private String username;
    private String password;
    private String phone;
    private String email;
    private String verificationCode;
    private String birth;
    private String gender;
    private Grade grade;
}