package com.withyou.backend.mypage.dto;

import com.withyou.backend.account.entity.Grade;
import com.withyou.backend.account.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MypageDTO {

    // =======================
    // 유저 정보
    // =======================
    private Long id;
    private String name;
    private String username;
    private String password;
    private String phone;
    private String email;
    private String birth;
    private String gender;
    private Grade grade;
    private Role role;

    public MypageDTO(Long id, String name, String username, String phone, String email, String birth, String gender, Grade grade, Role role) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.phone = phone;
        this.email = email;
        this.birth = birth;
        this.gender = gender;
        this.grade = grade;
        this.role = role;
    }
}
