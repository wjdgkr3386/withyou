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

    // 역할별 사용자 조회 (관리자용 학생 관리)
    java.util.List<User> findByRole(com.withyou.backend.account.entity.Role role);

    // 학생 목록 조회 (이름, 학년, 성별 필터링 및 페이징/정렬)
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.role = :role " +
            "AND (:name IS NULL OR u.name LIKE %:name%) " +
            "AND (:grade IS NULL OR u.grade = :grade) " +
            "AND (:gender IS NULL OR u.gender = :gender)")
    org.springframework.data.domain.Page<User> findStudentsPaged(
            @org.springframework.data.repository.query.Param("role") com.withyou.backend.account.entity.Role role,
            @org.springframework.data.repository.query.Param("name") String name,
            @org.springframework.data.repository.query.Param("grade") com.withyou.backend.account.entity.Grade grade,
            @org.springframework.data.repository.query.Param("gender") String gender,
            org.springframework.data.domain.Pageable pageable);
}