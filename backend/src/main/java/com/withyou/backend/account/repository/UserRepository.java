package com.withyou.backend.account.repository;

import com.withyou.backend.account.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    // 이름과 휴대폰 번호로 계정 찾기
    Optional<User> findByNameAndPhone(String name, String phone);

    // 이름, 아이디, 휴대폰 번호로 계정 찾기
    Optional<User> findByNameAndUsernameAndPhone(String name, String username, String phone);
}