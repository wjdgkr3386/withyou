package com.withyou.backend.admin.exam.repository;

import com.withyou.backend.admin.exam.entity.ExamSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamSubmissionRepository extends JpaRepository<ExamSubmission, Long> {
    List<ExamSubmission> findByUserIdAndExamId(Long userId, Long examId);
}
