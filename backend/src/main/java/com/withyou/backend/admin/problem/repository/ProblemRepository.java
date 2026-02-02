package com.withyou.backend.admin.problem.repository;

import com.withyou.backend.account.entity.Grade;
import com.withyou.backend.admin.problem.entity.Problem;
import com.withyou.backend.admin.problem.entity.ProblemDifficulty;
import com.withyou.backend.admin.problem.entity.ProblemType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProblemRepository extends JpaRepository<Problem, Long> {

    @Query("""
    select p
    from Problem p
    left join fetch p.options
    where (:grade is null or p.grade = :grade)
      and (:category is null or p.category = :category)
      and (:difficulty is null or p.difficulty = :difficulty)
      and (:type is null or p.type = :type)
    order by p.id asc
    """)
    List<Problem> findByFilterWithOptions(
            @Param("grade") Grade grade,
            @Param("category") String category,
            @Param("difficulty") ProblemDifficulty difficulty,
            @Param("type") ProblemType type,
            Pageable pageable
    );

    @Query("""
    select count(p) from Problem p
    where (:grade is null or p.grade = :grade)
      and (:category is null or p.category = :category)
      and (:difficulty is null or p.difficulty = :difficulty)
      and (:type is null or p.type = :type)
    """)
    long countByFilter(
            @Param("grade") Grade grade,
            @Param("category") String category,
            @Param("difficulty") ProblemDifficulty difficulty,
            @Param("type") ProblemType type
    );

}