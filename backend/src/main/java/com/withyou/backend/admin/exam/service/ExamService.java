package com.withyou.backend.admin.exam.service;

import com.withyou.backend.admin.exam.dto.ExamProblemDto;
import com.withyou.backend.admin.exam.dto.ExamResponseDTO;
import com.withyou.backend.admin.exam.dto.ExamSaveRequestDTO;
import com.withyou.backend.admin.exam.entity.Exam;
import com.withyou.backend.admin.exam.entity.ExamOption;
import com.withyou.backend.admin.exam.entity.ExamProblem;
import com.withyou.backend.admin.exam.entity.ExamSubmission;
import com.withyou.backend.admin.exam.repository.ExamRepository;
import com.withyou.backend.admin.problem.entity.Problem;
import com.withyou.backend.admin.problem.repository.ProblemRepository;
import com.withyou.backend.common.exception.CustomException;
import com.withyou.backend.common.s3.S3UploadService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final S3UploadService s3UploadService;
    private final ProblemRepository problemRepository;
    private final com.withyou.backend.admin.exam.repository.ExamSubmissionRepository submissionRepository;
    private final com.withyou.backend.account.repository.UserRepository userRepository;
    
    // 현재 활성화된 시험 방 코드 및 세션 ID (메모리 저장)
    private static String currentRoomCode = "";
    private static Long currentExamId = null;
    private static String currentSessionId = "";

    public ExamService(ExamRepository examRepository, 
                       S3UploadService s3UploadService, 
                       ProblemRepository problemRepository,
                       com.withyou.backend.admin.exam.repository.ExamSubmissionRepository submissionRepository,
                       com.withyou.backend.account.repository.UserRepository userRepository) {
        this.examRepository = examRepository;
        this.s3UploadService = s3UploadService;
        this.problemRepository = problemRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void submitAnswer(Long userId, Long examId, int problemOrder, String answer, String sessionId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new CustomException("시험을 찾을 수 없습니다."));
        com.withyou.backend.account.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다."));

        // 정답 채점 로직 (간단 비교)
        boolean isCorrect = false;
        ExamProblem problem = exam.getProblems().stream()
                .filter(p -> p.getProblemOrder() == problemOrder)
                .findFirst()
                .orElse(null);
        
        if (problem != null && problem.getAnswer() != null) {
            isCorrect = problem.getAnswer().trim().equals(answer.trim());
        }

        ExamSubmission submission = ExamSubmission.builder()
                .user(user)
                .exam(exam)
                .problemOrder(problemOrder)
                .submittedAnswer(answer)
                .isCorrect(isCorrect)
                .sessionId(sessionId)
                .build();

        submissionRepository.save(submission);
    }

    public List<Exam> findAllExams() {
        return examRepository.findAll();
    }

    // 방 코드 생성 (서버 메모리에 저장)
    public String createRoom(String code, Long examId) {
        currentRoomCode = code;
        currentExamId = examId;
        currentSessionId = java.util.UUID.randomUUID().toString();
        System.out.println("새로운 방이 생성되었습니다. 코드: " + code + ", 시험 ID: " + examId + ", 세션 ID: " + currentSessionId);
        return currentSessionId;
    }

    // 방 코드 확인
    public boolean checkRoomCode(String code) {
        return currentRoomCode != null && currentRoomCode.equals(code);
    }

    public Long getCurrentExamId() {
        return currentExamId;
    }

    public String getCurrentSessionId() {
        return currentSessionId;
    }

    // 특정 시험의 모든 세션 ID 조회
    public List<String> getSessionIdsByExamId(Long examId) {
        return submissionRepository.findDistinctSessionIdsByExamId(examId);
    }

    // 특정 세션의 학생별 성적 집계 정보 조회
    public List<java.util.Map<String, Object>> getSessionStats(String sessionId) {
        List<ExamSubmission> submissions = submissionRepository.findBySessionId(sessionId);
        
        // 학생 ID별로 그룹화 (맞은 개수 계산)
        java.util.Map<Long, java.util.Map<String, Object>> stats = new java.util.HashMap<>();
        
        for (ExamSubmission sub : submissions) {
            Long userId = sub.getUser().getId();
            stats.putIfAbsent(userId, new java.util.HashMap<>());
            java.util.Map<String, Object> userStat = stats.get(userId);
            
            if (!userStat.containsKey("userId")) {
                userStat.put("userId", userId);
                userStat.put("userName", sub.getUser().getName());
                userStat.put("examId", sub.getExam().getId());
                userStat.put("examTitle", sub.getExam().getTitle());
                userStat.put("totalQuestions", sub.getExam().getQuestionCount());
                userStat.put("correctCount", 0);
                userStat.put("createdAt", sub.getCreatedAt());
                userStat.put("submissions", new java.util.ArrayList<java.util.Map<String, Object>>());
            }
            
            if (sub.isCorrect()) {
                userStat.put("correctCount", (int)userStat.get("correctCount") + 1);
            }
            
            // 제출 상세 정보 추가
            java.util.List<java.util.Map<String, Object>> subs = (java.util.List<java.util.Map<String, Object>>) userStat.get("submissions");
            java.util.Map<String, Object> subDetail = new java.util.HashMap<>();
            subDetail.put("id", sub.getId()); // 채점을 위해 ID 추가
            subDetail.put("problemOrder", sub.getProblemOrder());
            subDetail.put("submittedAnswer", sub.getSubmittedAnswer());
            subDetail.put("isCorrect", sub.isCorrect());
            
            // 문제의 실제 정답 정보 추가 (비교용)
            ExamProblem problem = sub.getExam().getProblems().stream()
                    .filter(p -> p.getProblemOrder() == sub.getProblemOrder())
                    .findFirst()
                    .orElse(null);
            if (problem != null) {
                subDetail.put("correctAnswer", problem.getAnswer());
                subDetail.put("problemType", problem.getQuestionType());
                subDetail.put("problemContent", problem.getContent());
                subDetail.put("imageUrl", problem.getImageUrl());
                
                // 객관식일 경우 보기 정보 포함
                if (problem.getOptions() != null && !problem.getOptions().isEmpty()) {
                    java.util.List<java.util.Map<String, Object>> optList = problem.getOptions().stream()
                        .map(o -> {
                            java.util.Map<String, Object> m = new java.util.HashMap<>();
                            m.put("optionNumber", o.getOptionOrder());
                            m.put("content", o.getContent());
                            return m;
                        }).collect(java.util.stream.Collectors.toList());
                    subDetail.put("options", optList);
                }
            }

            subs.add(subDetail);
        }
        
        return new java.util.ArrayList<>(stats.values());
    }

    // 수동 채점 결과 반영
    @Transactional
    public void updateSubmissionResult(Long submissionId, boolean isCorrect) {
        ExamSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new CustomException("제출 정보를 찾을 수 없습니다."));
        submission.setCorrect(isCorrect);
        submissionRepository.save(submission);
    }

    @Transactional(readOnly = true)
    public ExamResponseDTO findExamById(Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new CustomException("시험을 찾을 수 없습니다. ID: " + id));

        List<ExamProblemDto> problemDtos = exam.getProblems().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ExamResponseDTO.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .questionCount(exam.getQuestionCount())
                .createdAt(exam.getCreatedAt())
                .modifiedAt(exam.getUpdatedAt())
                .problems(problemDtos)
                .build();
    }

    private ExamProblemDto convertToDto(ExamProblem problem) {
        ExamProblemDto dto = new ExamProblemDto();
        dto.setProblemOrder(problem.getProblemOrder());
        dto.setGrade(problem.getGrade());
        dto.setCategory(problem.getCategory());
        dto.setContent(problem.getContent());
        dto.setType(problem.getQuestionType());
        dto.setDifficulty(problem.getDifficulty());
        dto.setAnswer(problem.getAnswer());
        dto.setImageUrl(problem.getImageUrl());
        dto.setHasImage(problem.getImageUrl() != null && !problem.getImageUrl().isEmpty());
        dto.setTimeLimit(problem.getTimeLimit());

        List<ExamProblemDto.OptionDto> optionDtos = problem.getOptions().stream()
                .map(opt -> {
                    ExamProblemDto.OptionDto optDto = new ExamProblemDto.OptionDto();
                    optDto.setOptionNumber(opt.getOptionOrder());
                    optDto.setContent(opt.getContent());
                    return optDto;
                })
                .collect(Collectors.toList());
        dto.setOptions(optionDtos);

        return dto;
    }

    @Transactional
    public Exam saveExam(ExamSaveRequestDTO requestDTO) {
        Exam exam = Exam.builder()
                .title(requestDTO.getTitle())
                .questionCount(requestDTO.getQuestionCount())
                .build();

        Exam savedExam = examRepository.save(exam);

        if (requestDTO.getProblems() != null) {
            for (ExamProblemDto problemDto : requestDTO.getProblems()) {
                ExamProblem examProblem = ExamProblem.builder()
                        .exam(savedExam)
                        .problemOrder(problemDto.getProblemOrder())
                        .grade(problemDto.getGrade())
                        .category(problemDto.getCategory())
                        .content(problemDto.getContent())
                        .answer(problemDto.getAnswer())
                        .difficulty(problemDto.getDifficulty())
                        .questionType(problemDto.getType())
                        .imageUrl(problemDto.getImageUrl())
                        .timeLimit(problemDto.getTimeLimit() != null ? problemDto.getTimeLimit() : 0)
                        .build();

                if (problemDto.getOptions() != null) {
                    for (ExamProblemDto.OptionDto optionDto : problemDto.getOptions()) {
                        ExamOption examOption = ExamOption.builder()
                                .problem(examProblem)
                                .optionOrder(optionDto.getOptionNumber())
                                .content(optionDto.getContent())
                                .build();
                        examProblem.getOptions().add(examOption);
                    }
                }
                savedExam.getProblems().add(examProblem);
            }
        }

        return examRepository.save(savedExam);
    }

    @Transactional
    public void deleteExam(Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new CustomException("시험을 찾을 수 없습니다. ID: " + id));

        // Delete images from S3 if necessary
        for (ExamProblem problem : exam.getProblems()) {
            if (problem.getImageUrl() != null && !problem.getImageUrl().isEmpty()) {
                deleteImageFromS3(problem.getImageUrl());
            }
        }

        examRepository.delete(exam);
    }

    private void deleteImageFromS3(String imageUrl) {
        try {
            String filePath = extractFilePathFromUrl(imageUrl);
            if (filePath != null) {
                s3UploadService.delete(filePath);
            }
        } catch (Exception e) {
            System.err.println("Failed to delete S3 image: " + imageUrl);
        }
    }

    private String extractFilePathFromUrl(String imageUrl) {
        int imagesExamIndex = imageUrl.indexOf("images/exam/");
        if (imagesExamIndex != -1) {
            return imageUrl.substring(imagesExamIndex);
        }
        return null;
    }

    @Transactional
    public void updateTimeLimits(Long id, java.util.Map<Integer, Integer> timeLimits) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new CustomException("시험을 찾을 수 없습니다. ID: " + id));

        for (ExamProblem problem : exam.getProblems()) {
            Integer time = timeLimits.get(problem.getProblemOrder());
            if (time != null) {
                problem.setTimeLimit(time);
            }
        }
        examRepository.save(exam);
    }

    @Transactional
    public Exam updateExam(Long id, ExamSaveRequestDTO requestDTO) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new CustomException("시험을 찾을 수 없습니다. ID: " + id));

        // Clean up old images before updating
        for (ExamProblem problem : exam.getProblems()) {
            if (problem.getImageUrl() != null && !problem.getImageUrl().isEmpty()) {
                deleteImageFromS3(problem.getImageUrl());
            }
        }

        // Clear existing problems and re-add them
        exam.getProblems().clear();
        exam.setTitle(requestDTO.getTitle());
        exam.setQuestionCount(requestDTO.getQuestionCount());

        if (requestDTO.getProblems() != null) {
            for (ExamProblemDto problemDto : requestDTO.getProblems()) {
                ExamProblem examProblem = ExamProblem.builder()
                        .exam(exam)
                        .problemOrder(problemDto.getProblemOrder())
                        .grade(problemDto.getGrade())
                        .category(problemDto.getCategory())
                        .content(problemDto.getContent())
                        .answer(problemDto.getAnswer())
                        .difficulty(problemDto.getDifficulty())
                        .questionType(problemDto.getType())
                        .imageUrl(problemDto.getImageUrl())
                        .timeLimit(problemDto.getTimeLimit() != null ? problemDto.getTimeLimit() : 0)
                        .build();

                if (problemDto.getOptions() != null) {
                    for (ExamProblemDto.OptionDto optionDto : problemDto.getOptions()) {
                        ExamOption examOption = ExamOption.builder()
                                .problem(examProblem)
                                .optionOrder(optionDto.getOptionNumber())
                                .content(optionDto.getContent())
                                .build();
                        examProblem.getOptions().add(examOption);
                    }
                }
                exam.getProblems().add(examProblem);
            }
        }

        return examRepository.save(exam);
    }
}
