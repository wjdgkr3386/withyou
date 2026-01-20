package com.withyou.backend.account.entity;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Getter
@Table(name = "users")
public class User {

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, comment = "권한")
    private Role role;

    public User(){}
    public User(String name, String username, String password, String phone, String email, Role role) {
        this.name = name;
        this.username = username;
        this.password = password;
        this.phone = phone;
        this.email = email;
        this.role = role;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
