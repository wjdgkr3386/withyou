package com.withyou.backend.account.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {
    private String username;
    private String role;
    private Long id;
    private String name;
    private String grade;
    private String gender;
    private String email;
    private java.time.LocalDateTime createdAt;
}
