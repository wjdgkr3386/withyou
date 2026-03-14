package com.withyou.backend.account.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FindDTO {
    private String name;
    private String email;
    private String phone;
    private String username;
    private String verificationCode;
}