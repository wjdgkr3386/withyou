package com.withyou.backend.mypage.controller;

import com.withyou.backend.common.ApiResponse;
import com.withyou.backend.mypage.dto.MypageDTO;
import com.withyou.backend.mypage.service.MypageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RequestMapping("/api")
@RestController
public class MypageController {

    @Autowired
    MypageService mypageService;

    @GetMapping("/mypage")
    public ResponseEntity<ApiResponse<MypageDTO>> getMyPageData(Principal principal) {
        String username = principal.getName();
        MypageDTO mypage = mypageService.getMypage(username);
        return ResponseEntity.ok(ApiResponse.success("마이페이지 정보 조회 성공", mypage));
    }
}
