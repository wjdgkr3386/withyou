package com.withyou.backend.admin.exam.repository;

import com.withyou.backend.admin.exam.entity.ExamProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamProblemRepository extends JpaRepository<ExamProblem, Long> {
}
