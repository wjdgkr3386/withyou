package com.withyou.backend.account.controller;

import com.withyou.backend.account.dto.FindDTO;
import com.withyou.backend.account.dto.LoginResponse;
import com.withyou.backend.account.service.AccountService;
import com.withyou.backend.account.dto.LoginDTO;
import com.withyou.backend.account.dto.SignupDTO;
import com.withyou.backend.common.ApiResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // =========================================================
    // 회원가입 관련
    // =========================================================

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@RequestBody SignupDTO request) {
        accountService.signup(request);
        return ResponseEntity.ok(ApiResponse.success("회원가입 성공", null));
    }

    @PostMapping("/sms/send")
    public ResponseEntity<ApiResponse<Void>> sendSignupCode(@RequestBody SignupDTO request) {
        accountService.sendSignupCode(request.getPhone());
        return ResponseEntity.ok(ApiResponse.success("회원가입 인증번호 발송 성공", null));
    }

    @PostMapping("/sms/verify")
    public ResponseEntity<ApiResponse<Void>> verifySignupCode(@RequestBody SignupDTO request) {
        accountService.verifySignupCode(request.getPhone(), request.getVerificationCode());
        return ResponseEntity.ok(ApiResponse.success("전화번호 인증 성공", null));
    }

    @PostMapping("/email/send")
    public ResponseEntity<ApiResponse<Void>> sendEmailCode(@RequestBody SignupDTO request) {
        accountService.sendEmailCode(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("이메일 인증번호 발송 성공", null));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<ApiResponse<Void>> verifyEmailCode(@RequestBody SignupDTO request) {
        accountService.verifyEmailCode(request.getEmail(), request.getVerificationCode());
        return ResponseEntity.ok(ApiResponse.success("이메일 인증 성공", null));
    }

    // =========================================================
    // 계정 찾기 관련
    // =========================================================

    @PostMapping("/find/username")
    public ResponseEntity<ApiResponse<String>> findUsername(@RequestBody FindDTO request) {
        String username = accountService.findUsername(request);
        return ResponseEntity.ok(ApiResponse.success("아이디 찾기 성공", username));
    }

    // 비밀번호 찾기용 이메일 인증번호 발송
    @PostMapping("/find/password/email/send")
    public ResponseEntity<ApiResponse<Void>> sendFindPwEmailCode(@RequestBody FindDTO request) {
        accountService.sendFindPwEmailCode(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("비밀번호 찾기 인증번호 발송 성공", null));
    }

    // 비밀번호 찾기용 이메일 인증번호 검증
    @PostMapping("/find/password/email/verify")
    public ResponseEntity<ApiResponse<Void>> verifyFindPwEmailCode(@RequestBody FindDTO request) {
        accountService.verifyFindPwEmailCode(request.getEmail(), request.getVerificationCode());
        return ResponseEntity.ok(ApiResponse.success("이메일 인증 성공", null));
    }

    // 비밀번호 찾기 (임시 비밀번호 발급)
    @PostMapping("/find/password")
    public ResponseEntity<ApiResponse<Void>> findPassword(@RequestBody FindDTO request) {
        accountService.findPassword(request);
        return ResponseEntity.ok(ApiResponse.success("임시 비밀번호 발송 성공", null));
    }

    // =========================================================
    // 인증/로그아웃/기타
    // =========================================================

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(@RequestBody LoginDTO loginRequest, HttpServletResponse response) {
        String token = accountService.login(loginRequest);
        Cookie cookie = new Cookie("accessToken", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(loginRequest.isRememberMe() ? 60 * 60 * 24 * 28 : -1);
        response.addCookie(cookie);
        return ResponseEntity.ok(ApiResponse.success("로그인 성공", null));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response, Authentication auth) {
        if (auth != null) {
            accountService.logout(auth.getName());
        }
        Cookie cookie = new Cookie("accessToken", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse>> getMyInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(ApiResponse.error("로그인 필요"));
        }

        String username = authentication.getName();
        com.withyou.backend.account.entity.User user = accountService.findUserByUsername(username);

        String role = user.getRole().name();
        String grade = user.getGrade() != null ? user.getGrade().name() : "";

        LoginResponse response = new LoginResponse(
                user.getUsername(),
                role,
                user.getId(),
                user.getName(),
                grade,
                user.getGender() != null ? user.getGender() : "",
                user.getEmail() != null ? user.getEmail() : "",
                user.getCreatedAt()
        );
        return ResponseEntity.ok(ApiResponse.success("조회 성공", response));
    }

    // =========================================================
    // 회원탈퇴
    // =========================================================
    @DeleteMapping("/users/me")
    public ResponseEntity<ApiResponse<Void>> withdraw(HttpServletResponse response) {
        accountService.withdraw();
        Cookie cookie = new Cookie("accessToken", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
        return ResponseEntity.ok(ApiResponse.success("회원탈퇴 완료", null));
    }

    // =========================================================
    // 관리자용 학생 관리
    // =========================================================
    @GetMapping("/admin/users")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getAllStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) com.withyou.backend.account.entity.Grade grade,
            @RequestParam(required = false) String gender,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        org.springframework.data.domain.Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? org.springframework.data.domain.Sort.by(sortBy).ascending()
                : org.springframework.data.domain.Sort.by(sortBy).descending();

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);

        org.springframework.data.domain.Page<com.withyou.backend.account.entity.User> studentsPage =
                accountService.findStudentsPaged(name, grade, gender, pageable);

        java.util.List<LoginResponse> studentsList = studentsPage.getContent().stream()
                .map(user -> new LoginResponse(
                        user.getUsername(),
                        user.getRole().name(),
                        user.getId(),
                        user.getName(),
                        user.getGrade() != null ? user.getGrade().name() : "",
                        user.getGender() != null ? user.getGender() : "",
                        user.getEmail() != null ? user.getEmail() : "",
                        user.getCreatedAt()
                ))
                .toList();

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("list", studentsList);
        response.put("totalElements", studentsPage.getTotalElements());
        response.put("totalPages", studentsPage.getTotalPages());
        response.put("currentPage", studentsPage.getNumber());

        return ResponseEntity.ok(ApiResponse.success("학생 목록 조회 성공", response));
    }
}