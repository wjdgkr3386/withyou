package com.withyou.backend.admin.exam.controller;

import com.withyou.backend.admin.exam.dto.ExamSaveRequestDTO;
import com.withyou.backend.admin.exam.entity.Exam;
import com.withyou.backend.admin.exam.service.ExamService;
import com.withyou.backend.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("api/admin/exams")
@RestController
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    // 시험 목록 조회
    @GetMapping
    public ResponseEntity<ApiResponse<List<Exam>>> getExams() {
        List<Exam> exams = examService.findAllExams();
        return ResponseEntity.ok(ApiResponse.success("조회 성공", exams));
    }

    // 시험 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Exam>> getExamById(@PathVariable Long id) {
        System.out.println("ExamController - getExamById: " + id);
        Exam exam = examService.findExamById(id);
        return ResponseEntity.ok(ApiResponse.success("시험 상세 조회 성공", exam));
    }

    // 시험 생성
    @PostMapping
    public ResponseEntity<ApiResponse<Exam>> createExam(@RequestBody ExamSaveRequestDTO requestDTO) {
        System.out.println("ExamController - createExam");
        System.out.println("Received problem IDs: " + requestDTO.getProblemIds());
        Exam savedExam = examService.saveExam(requestDTO);
        return ResponseEntity.ok(ApiResponse.success("시험 생성 성공", savedExam));
    }

    // 시험 수정
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Exam>> updateExam(
            @PathVariable Long id,
            @RequestBody ExamSaveRequestDTO requestDTO
    ) {
        System.out.println("ExamController - updateExam: " + id);
        Exam updatedExam = examService.updateExam(id, requestDTO);
        return ResponseEntity.ok(ApiResponse.success("시험 수정 성공", updatedExam));
    }

    // 시험 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable Long id) {
        System.out.println("ExamController - deleteExam: " + id);
        examService.deleteExam(id);
        return ResponseEntity.ok(ApiResponse.success("시험 삭제 성공", null));
    }
}