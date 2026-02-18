package com.withyou.backend.admin.exam.controller;

import com.withyou.backend.admin.exam.dto.ExamResponseDTO;
import com.withyou.backend.admin.exam.dto.ExamSaveRequestDTO;
import com.withyou.backend.admin.exam.entity.Exam;
import com.withyou.backend.admin.exam.service.ExamService;
import com.withyou.backend.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/admin/exams")
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
    public ResponseEntity<ApiResponse<ExamResponseDTO>> getExamById(@PathVariable Long id) {
        ExamResponseDTO exam = examService.findExamById(id);
        return ResponseEntity.ok(ApiResponse.success("시험 상세 조회 성공", exam));
    }

    // 시험 생성
    @PostMapping
    public ResponseEntity<ApiResponse<Exam>> createExam(@RequestBody ExamSaveRequestDTO requestDTO) {
        Exam savedExam = examService.saveExam(requestDTO);
        return ResponseEntity.ok(ApiResponse.success("시험 생성 성공", savedExam));
    }

    // 시험 수정
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Exam>> updateExam(
            @PathVariable Long id,
            @RequestBody ExamSaveRequestDTO requestDTO
    ) {
        Exam updatedExam = examService.updateExam(id, requestDTO);
        return ResponseEntity.ok(ApiResponse.success("시험 수정 성공", updatedExam));
    }

    // 시간 설정 저장 전용 API
    @PutMapping("/{id}/time-limits")
    public ResponseEntity<ApiResponse<Void>> updateTimeLimits(
            @PathVariable Long id,
            @RequestBody java.util.Map<Integer, Integer> timeLimits
    ) {
        examService.updateTimeLimits(id, timeLimits);
        return ResponseEntity.ok(ApiResponse.success("시간 설정 저장 성공", null));
    }

    // 시험 대기방 코드 생성 API
    @PostMapping("/room/create")
    public ResponseEntity<ApiResponse<Void>> createRoom(@RequestBody java.util.Map<String, Object> payload) {
        String code = (String) payload.get("code");
        Object examIdObj = payload.get("examId");
        Long examId = null;
        if (examIdObj instanceof Integer) examId = ((Integer) examIdObj).longValue();
        else if (examIdObj instanceof Long) examId = (Long) examIdObj;
        
        examService.createRoom(code, examId);
        return ResponseEntity.ok(ApiResponse.success("방 코드 생성 성공", null));
    }

    // 시험 대기방 코드 확인 API
    @PostMapping("/room/check")
    public ResponseEntity<ApiResponse<Long>> checkRoomCode(@RequestBody java.util.Map<String, String> payload) {
        String code = payload.get("code");
        boolean isValid = examService.checkRoomCode(code);
        if (isValid) {
            return ResponseEntity.ok(ApiResponse.success("입장 허용", examService.getCurrentExamId()));
        } else {
            return ResponseEntity.status(401).body(ApiResponse.error("입장 코드가 일치하지 않습니다."));
        }
    }

    // 시험 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable Long id) {
        examService.deleteExam(id);
        return ResponseEntity.ok(ApiResponse.success("시험 삭제 성공", null));
    }
}
