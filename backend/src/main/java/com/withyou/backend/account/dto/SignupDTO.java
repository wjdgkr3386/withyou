package com.withyou.backend.account.dto;

import com.withyou.backend.account.entity.Grade;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupDTO {

    @jakarta.validation.constraints.NotBlank(message = "이름은 필수 입력 항목입니다.")
    private String name;

    @jakarta.validation.constraints.NotBlank(message = "아이디는 필수 입력 항목입니다.")
    private String username;

    @jakarta.validation.constraints.NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
    private String password;

    @jakarta.validation.constraints.NotBlank(message = "전화번호는 필수 입력 항목입니다.")
    private String phone;

    @jakarta.validation.constraints.NotBlank(message = "이메일은 필수 입력 항목입니다.")
    @jakarta.validation.constraints.Email(message = "이메일 형식이 올바르지 않습니다.")
    private String email;

    private String verificationCode;

    @jakarta.validation.constraints.NotBlank(message = "생년월일은 필수 입력 항목입니다.")
    private String birth;

    @jakarta.validation.constraints.NotBlank(message = "성별은 필수 입력 항목입니다.")
    private String gender;

    @jakarta.validation.constraints.NotNull(message = "학년은 필수 선택 항목입니다.")
    private com.withyou.backend.account.entity.Grade grade;
}