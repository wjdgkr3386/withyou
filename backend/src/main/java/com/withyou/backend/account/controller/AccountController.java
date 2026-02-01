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

    // 회원가입용 인증번호 발송
    @PostMapping("/sms/send")
    public ResponseEntity<ApiResponse<Void>> sendSignupCode(@RequestBody FindDTO request) {
        accountService.sendSignupCode(request.getPhone());
        return ResponseEntity.ok(ApiResponse.success("회원가입 인증번호 발송 성공", null));
    }

    // 회원가입용 인증번호 검증
    @PostMapping("/sms/verify")
    public ResponseEntity<ApiResponse<Void>> verifySignupCode(@RequestBody SignupDTO request) {
        accountService.verifySignupCode(request.getPhone(), request.getVerificationCode());
        return ResponseEntity.ok(ApiResponse.success("인증 성공", null));
    }

    // =========================================================
    // 계정 찾기 관련
    // =========================================================

    // 아이디 찾기
    @PostMapping("/find/username")
    public ResponseEntity<ApiResponse<String>> findUsername(@RequestBody FindDTO request) {
        String username = accountService.findUsername(request);
        return ResponseEntity.ok(ApiResponse.success("아이디 찾기 성공", username));
    }

    // 비밀번호 찾기용 인증번호 발송
    @PostMapping("/send-verification") // 프론트 엔드포인트 유지
    public ResponseEntity<ApiResponse<Void>> sendFindPwCode(@RequestBody FindDTO request) {
        accountService.sendFindPwCode(request.getPhone());
        return ResponseEntity.ok(ApiResponse.success("비밀번호 찾기 인증번호 발송 성공", null));
    }

    // 비밀번호 찾기 (검증 및 임시 비밀번호 발급)
    @PostMapping("/find/password")
    public ResponseEntity<ApiResponse<Void>> findPassword(@RequestBody FindDTO request) {
        accountService.findPassword(request);
        return ResponseEntity.ok(ApiResponse.success("임시 비밀번호 발송 성공", null));
    }

    // =========================================================
    // 인증/로그아웃/기타
    // =========================================================

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(@RequestBody LoginDTO loginRequest, HttpServletResponse response) {
        String token = accountService.login(loginRequest);
        Cookie cookie = new Cookie("accessToken", token);

        cookie.setHttpOnly(true);
        cookie.setPath("/");
        // 로그인 유지 (체크o : 30일 유지, 체크x : 브라우저 종료까지 유지)
        cookie.setMaxAge(loginRequest.isRememberMe()?60 * 60 * 24 * 28:-1);

        response.addCookie(cookie);
        return ResponseEntity.ok(ApiResponse.success("로그인 성공", null));
    }

    // 로그아웃
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

    // 네비바 로그인 롹인
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse>> getMyInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // 이름 확인
        String username = authentication.getName();
        // 권한 확인
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("ROLE_USER").replace("ROLE_", "");

        if (username == null || username.equals("anonymousUser")) {
            return ResponseEntity.status(401).body(ApiResponse.error("로그인 필요"));
        }

        LoginResponse response = new LoginResponse(username, role);
        return ResponseEntity.ok(ApiResponse.success("조회 성공", response));
    }

    // =========================================================
    // 회원탈퇴
    // =========================================================
    @DeleteMapping("/users/me")
    public ResponseEntity<ApiResponse<Void>> withdraw(HttpServletResponse response) {
        accountService.withdraw();

        // 쿠키 삭제 (로그아웃 처리)
        Cookie cookie = new Cookie("accessToken", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);

        return ResponseEntity.ok(ApiResponse.success("회원탈퇴 완료", null));
    }

}