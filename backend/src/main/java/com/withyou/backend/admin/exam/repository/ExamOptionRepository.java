package com.withyou.backend.admin.exam.repository;

import com.withyou.backend.admin.exam.entity.ExamOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamOptionRepository extends JpaRepository<ExamOption, Long> {
}
