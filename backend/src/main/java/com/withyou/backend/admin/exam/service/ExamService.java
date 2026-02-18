package com.withyou.backend.admin.exam.service;

import com.withyou.backend.admin.exam.dto.ExamProblemDto;
import com.withyou.backend.admin.exam.dto.ExamResponseDTO;
import com.withyou.backend.admin.exam.dto.ExamSaveRequestDTO;
import com.withyou.backend.admin.exam.entity.Exam;
import com.withyou.backend.admin.exam.entity.ExamOption;
import com.withyou.backend.admin.exam.entity.ExamProblem;
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
    
    // 현재 활성화된 시험 방 코드 (메모리 저장)
    private static String currentRoomCode = "";
    private static Long currentExamId = null;

    public ExamService(ExamRepository examRepository, S3UploadService s3UploadService, ProblemRepository problemRepository) {
        this.examRepository = examRepository;
        this.s3UploadService = s3UploadService;
        this.problemRepository = problemRepository;
    }

    public List<Exam> findAllExams() {
        return examRepository.findAll();
    }

    // 방 코드 생성 (서버 메모리에 저장)
    public void createRoom(String code, Long examId) {
        currentRoomCode = code;
        currentExamId = examId;
        System.out.println("새로운 방이 생성되었습니다. 코드: " + code + ", 시험 ID: " + examId);
    }

    // 방 코드 확인
    public boolean checkRoomCode(String code) {
        return currentRoomCode != null && currentRoomCode.equals(code);
    }

    public Long getCurrentExamId() {
        return currentExamId;
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
