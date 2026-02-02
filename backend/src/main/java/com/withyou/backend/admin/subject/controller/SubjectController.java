package com.withyou.backend.admin.subject.controller;

import com.withyou.backend.admin.subject.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<Map<String, List<String>>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.findAllAsMap());
    }

    @PostMapping("/update")
    public ResponseEntity<String> updateSubjects(@RequestBody Map<String, List<String>> request) {
        subjectService.updateAll(request);
        return ResponseEntity.ok("Success");
    }
}