package com.withyou.backend.account;

import com.withyou.backend.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping("/user")
    public ResponseEntity<ApiResponse<Void>> signup(@RequestBody SignupDTO request) {
        accountService.signup(request);
        return ResponseEntity.ok(ApiResponse.success("회원가입 성공", null));
    }
}