package com.withyou.backend.mypage.controller;

import com.withyou.backend.common.ApiResponse;
import com.withyou.backend.mypage.dto.MypageDTO;
import com.withyou.backend.mypage.dto.UpdateDTO;
import com.withyou.backend.mypage.service.MypageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PatchMapping("/mypage/profile")
    public ResponseEntity<ApiResponse<Void>> updateMyProfile(
            Principal principal,
            @RequestBody UpdateDTO updateDTO
    ) {
        System.out.println(updateDTO.getGrade());
        String username = principal.getName();
        mypageService.updateMyProfile(username, updateDTO);
        return ResponseEntity.ok(ApiResponse.success("프로필 수정 완료", null));
    }
}
