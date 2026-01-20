package com.withyou.backend.account.controller;

import com.withyou.backend.account.dto.FindDTO;
import com.withyou.backend.account.service.AccountService;
import com.withyou.backend.account.dto.LoginDTO;
import com.withyou.backend.account.dto.SignupDTO;
import com.withyou.backend.common.ApiResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // 회원가입 로직
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@RequestBody SignupDTO request) {
        accountService.signup(request);
        return ResponseEntity.ok(ApiResponse.success("회원가입 성공", null));
    }

    // 로그인 로직
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(@RequestBody LoginDTO loginRequest, HttpServletResponse response) {
        String token = accountService.login(loginRequest);

        Cookie cookie = new Cookie("accessToken", token);
        cookie.setHttpOnly(true);       // JavaScript 접근 차단 (보안 핵심)
        cookie.setSecure(false);        // HTTPS 환경이라면 true로 설정
        cookie.setPath("/");            // 모든 경로에서 쿠키 사용
        cookie.setMaxAge(60 * 60 * 24); // 쿠키 유효 기간 (1일)
        
        response.addCookie(cookie);

        return ResponseEntity.ok(ApiResponse.success("로그인 성공", null));
    }

    // 로그아웃 로직
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("accessToken", null);
        cookie.setMaxAge(0); // 즉시 삭제
        cookie.setPath("/");
        response.addCookie(cookie);
        return ResponseEntity.ok().build();
    }

    // 로그인 상태 확인
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<String>> getMyInfo() {
        // SecurityContextHolder에서 인증된 사용자 ID를 가져옴
        String username = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();

        if (username == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("로그인 필요"));
        }

        return ResponseEntity.ok(ApiResponse.success("조회 성공", username));
    }

    // 아이디 찾기
    @PostMapping("/find/username")
    public ResponseEntity<ApiResponse<String>> findUsername(@RequestBody FindDTO request) {
        System.out.println("findUsername 들어옴");
        String username = accountService.findUsername(request);
        return ResponseEntity.ok(ApiResponse.success("아이디 찾기 성공", username));
    }

    // 인증번호 발송
    @PostMapping("/send-verification")
    public ResponseEntity<ApiResponse<Void>> sendVerificationCode(@RequestBody FindDTO request) {
        System.out.println("sendVerification 들어옴");
        accountService.sendVerificationCode(request.getPhone());
        return ResponseEntity.ok(ApiResponse.success("인증번호 발송 성공", null));
    }

    // 비밀번호 찾기 (임시 비밀번호 발급)
    @PostMapping("/find/password")
    public ResponseEntity<ApiResponse<Void>> findPassword(@RequestBody FindDTO request) {
        System.out.println("findPassword 들어옴");
        accountService.findPassword(request);
        return ResponseEntity.ok(ApiResponse.success("임시 비밀번호 발송 성공", null));
    }
}