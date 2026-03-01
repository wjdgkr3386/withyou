package com.withyou.backend.admin.exam.repository;

import com.withyou.backend.admin.exam.entity.ExamSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamSubmissionRepository extends JpaRepository<ExamSubmission, Long> {
    List<ExamSubmission> findByUserIdAndExamId(Long userId, Long examId);
    List<ExamSubmission> findBySessionId(String sessionId);
    
    @org.springframework.data.jpa.repository.Query("SELECT e.sessionId FROM ExamSubmission e WHERE e.exam.id = :examId GROUP BY e.sessionId ORDER BY MAX(e.createdAt) DESC")
    List<String> findDistinctSessionIdsByExamId(@org.springframework.data.repository.query.Param("examId") Long examId);
}
