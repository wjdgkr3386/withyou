package com.withyou.backend.account.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "users")
public class User extends com.withyou.backend.common.entity.BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(comment = "고유 아이디")
    private Long id;

    @Column(length = 50, nullable = false, comment = "이름")
    private String name;

    @Column(length = 50, nullable = false, unique = true, comment = "아이디")
    private String username;

    @Column(length = 200, nullable = false, comment = "비밀번호")
    private String password;

    @Column(length = 11, nullable = false, unique = true, comment = "전화번호")
    private String phone;

    @Column(length = 50, unique = true, comment = "이메일")
    private String email;

    @Column(length = 10, nullable = false, comment = "생년월일")
    private String birth;

    @Column(length = 10, nullable = false, comment = "성별")
    private String gender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Grade grade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, comment = "권한")
    private Role role;

    @Column(nullable = false)
    private boolean active = true;

    public User(){}
    public User(String name, String username, String password, String phone, String email, String birth, String gender, Grade grade, Role role) {
        this.name = name;
        this.username = username;
        this.password = password;
        this.phone = phone;
        this.email = email;
        this.birth = birth;
        this.gender = gender;
        this.grade = grade;
        this.role = role;
    }

    // 회원 탈퇴 (소프트 탈퇴)
    public void withdraw(String phone, String email) {
        this.active = false;
        this.phone = "WD" + this.id;   // 길이 매우 짧음
        this.email = email != null ? "WD" + this.id + "@withdraw.local" : null;
    }
}
