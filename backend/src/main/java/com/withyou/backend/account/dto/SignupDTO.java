package com.withyou.backend.account.dto;

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
}