package com.withyou.backend.admin.subject.service;

import com.withyou.backend.admin.subject.entity.Subject;
import com.withyou.backend.admin.subject.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubjectService {

    private final SubjectRepository subjectRepository;

    public Map<String, List<String>> findAllAsMap() {
        // 정렬 순서대로 가져와서 Map으로 그룹화
        List<Subject> all = subjectRepository.findAll(Sort.by(Sort.Direction.ASC, "sortOrder"));

        return all.stream().collect(Collectors.groupingBy(
                s -> s.getGrade() + "-" + s.getTerm(),
                Collectors.mapping(Subject::getContent, Collectors.toList())
        ));
    }

    @Transactional
    public void updateAll(Map<String, List<String>> subjectMap) {
        // 기존 데이터를 모두 지우고 새로 저장 (설정 데이터 관리용 방식)
        subjectRepository.deleteAll();

        List<Subject> newSubjects = new ArrayList<>();

        subjectMap.forEach((key, contents) -> {
            String[] split = key.split("-");
            if (split.length == 2) {
                String grade = split[0];
                String term = split[1];

                for (int i = 0; i < contents.size(); i++) {
                    Subject s = new Subject();
                    s.setGrade(grade);
                    s.setTerm(term);
                    s.setContent(contents.get(i));
                    s.setSortOrder(i);
                    newSubjects.add(s);
                }
            }
        });

        subjectRepository.saveAll(newSubjects);
    }
}