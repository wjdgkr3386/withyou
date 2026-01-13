package com.withyou.backend.main;

import com.withyou.backend.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/api/main")
@RestController
public class MainController {

    private final MainService mainService;

    public MainController(MainService mainService){
        this.mainService = mainService;
    }

    @GetMapping("/images/banner")
    public ResponseEntity<ApiResponse<List<MainImageDTO>>> getMainImages() {
        System.out.println("MainController - getMainImages");
        return ResponseEntity.ok(ApiResponse.success("조회 성공", mainService.getMainBanner()));
    }
}
