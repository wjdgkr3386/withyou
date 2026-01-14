package com.withyou.backend.account;

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
}