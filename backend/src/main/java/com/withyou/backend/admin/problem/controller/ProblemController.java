package com.withyou.backend.admin.problem.controller;

import com.withyou.backend.common.ApiResponse;
import com.withyou.backend.admin.problem.dto.ProblemCreateRequest;
import com.withyou.backend.admin.problem.dto.ProblemSearchRequest;
import com.withyou.backend.admin.problem.dto.ProblemSearchResponse;
import com.withyou.backend.admin.problem.service.ProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/problem")
public class ProblemController {

    private final ProblemService problemService;

    // 문제 생성
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> addProblem(
            @Valid @RequestPart("problem") ProblemCreateRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        problemService.create(request, image);
        return ResponseEntity.ok(ApiResponse.success("문제 등록 성공", null));
    }

    // 문제 필터 검색
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<ProblemSearchResponse>> searchProblems(
            @ModelAttribute ProblemSearchRequest request
    ) {
        ProblemSearchResponse response = problemService.search(request);
        return ResponseEntity.ok(ApiResponse.success("문제 검색 성공", response));
    }
}
