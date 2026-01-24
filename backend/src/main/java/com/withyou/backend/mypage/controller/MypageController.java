package com.withyou.backend.mypage.controller;

import com.withyou.backend.account.service.AccountService;
import com.withyou.backend.common.ApiResponse;
import com.withyou.backend.mypage.dto.MypageDTO;
import com.withyou.backend.mypage.dto.PasswordChangeDTO;
import com.withyou.backend.mypage.dto.UpdateDTO;
import com.withyou.backend.mypage.service.MypageService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RequestMapping("/api")
@RestController
public class MypageController {

    @Autowired
    MypageService mypageService;
    @Autowired
    AccountService accountService;

    @GetMapping("/mypage")
    public ResponseEntity<ApiResponse<MypageDTO>> getMyPageData(Principal principal) {
        String username = principal.getName();
        MypageDTO mypage = mypageService.getMypage(username);
        return ResponseEntity.ok(ApiResponse.success("마이페이지 정보 조회 성공", mypage));
    }

    @PatchMapping("/mypage/profile")
    public ResponseEntity<ApiResponse<Void>> updateMyProfile(
        Principal principal,
        @RequestBody UpdateDTO updateDTO
    ) {
        String username = principal.getName();
        mypageService.updateMyProfile(username, updateDTO);
        return ResponseEntity.ok(ApiResponse.success("프로필 수정 완료", null));
    }

    @PatchMapping("/mypage/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
        @RequestBody PasswordChangeDTO passwordChangeDTO,
        HttpServletResponse response,
        Authentication authentication
    ) {
        String username = authentication.getName();
        // 비밀번호 변경
        accountService.updatePassword(username, passwordChangeDTO);
        // 쿠키 무효화
        Cookie cookie = new Cookie("accessToken", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
        // 로그아웃
        accountService.logout(username);
        return ResponseEntity.ok().body(ApiResponse.success("비밀번호가 변경되었습니다.", null));
    }
}
