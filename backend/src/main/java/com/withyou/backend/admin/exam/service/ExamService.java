package com.withyou.backend.admin.exam.service;

import com.withyou.backend.admin.exam.dto.ExamSaveRequestDTO;
import com.withyou.backend.admin.exam.entity.Exam;
import com.withyou.backend.admin.exam.repository.ExamRepository;
import com.withyou.backend.admin.problem.entity.Problem;
import com.withyou.backend.admin.problem.repository.ProblemRepository;
import com.withyou.backend.common.exception.CustomException;
import com.withyou.backend.common.s3.S3UploadService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final S3UploadService s3UploadService;
    private final ProblemRepository problemRepository;


    public ExamService(ExamRepository examRepository, S3UploadService s3UploadService, ProblemRepository problemRepository) {
        this.examRepository = examRepository;
        this.s3UploadService = s3UploadService;
        this.problemRepository = problemRepository;
    }

    public List<Exam> findAllExams() {
        return examRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Exam findExamById(Long id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new CustomException("시험을 찾을 수 없습니다. ID: " + id));
    }

    @Transactional
    public Exam saveExam(ExamSaveRequestDTO requestDTO) {

        // Handle exam creation from problem IDs
        if (requestDTO.getProblemIds() != null && !requestDTO.getProblemIds().isEmpty()) {
            // 1. Create a preliminary exam to get an ID
            Exam preExam = Exam.builder()
                    .title(requestDTO.getTitle())
                    .questionCount(requestDTO.getQuestionCount())
                    .content("") // Temporary empty content
                    .build();
            Exam savedExam = examRepository.save(preExam);
            Long examId = savedExam.getId();

            // 2. Build content by fetching problems and copying images
            StringBuilder contentBuilder = new StringBuilder();
            List<Problem> problems = requestDTO.getProblemIds().stream()
                    .map(id -> problemRepository.findById(id)
                            .orElseThrow(() -> new CustomException("문제를 찾을 수 없습니다. ID: " + id)))
                    .collect(Collectors.toList());

            for (Problem problem : problems) {
                contentBuilder.append("<h2>문제 ").append(problem.getId()).append("</h2>");
                contentBuilder.append(problem.getContent());

                if (problem.getImageUrl() != null && !problem.getImageUrl().isEmpty()) {
                    String newImageUrl = s3UploadService.copyImage(problem.getImageUrl(), "images/exam/" + examId);
                    contentBuilder.append("<img src=\"").append(newImageUrl).append("\" alt=\"문제 이미지\" />");
                }

                if ("객관식".equals(problem.getType().name()) && problem.getOptions() != null && !problem.getOptions().isEmpty()) {
                    contentBuilder.append("<h3>보기</h3><ul>");
                    problem.getOptions().forEach(option ->
                            contentBuilder.append("<li>").append(option.getContent()).append("</li>")
                    );
                    contentBuilder.append("</ul>");
                }
                contentBuilder.append("<p><strong>정답:</strong> ").append(problem.getAnswer()).append("</p><hr>");
            }

            // 3. Update the exam with the final content
            System.out.println("Generated Content: " + contentBuilder.toString());
            savedExam.updateExam(savedExam.getTitle(), contentBuilder.toString(), savedExam.getQuestionCount());
            return examRepository.save(savedExam);

        } else { // Fallback to original logic for raw content
            // Create a preliminary exam to get an ID for the S3 path
            Exam preExam = Exam.builder()
                    .title(requestDTO.getTitle())
                    .questionCount(requestDTO.getQuestionCount())
                    .content("") // Temporary
                    .build();
            Exam savedExam = examRepository.save(preExam);
            Long examId = savedExam.getId();

            // Process content to upload images to the correct folder
            String processedContent = processAndUploadImages(requestDTO.getContent(), examId);
            
            // Update the exam with the final content
            savedExam.updateExam(requestDTO.getTitle(), processedContent, requestDTO.getQuestionCount());
            return examRepository.save(savedExam);
        }
    }

    private String processAndUploadImages(String content, Long examId) {
        if (content == null) return "";
        // Regex to find img tags with data URIs
        Pattern pattern = Pattern.compile("<img[^>]+src=\"(data:image/[^;]+;base64,[^\"]+)\"");
        Matcher matcher = pattern.matcher(content);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String fullImgTag = matcher.group(0); // The whole <img> tag
            String dataUri = matcher.group(1); // The data URI part

            String[] parts = dataUri.split(",");
            String mimeType = parts[0].split(";")[0].split(":")[1]; // e.g., image/png
            String base64Image = parts[1];

            try {
                byte[] imageBytes = Base64.getDecoder().decode(base64Image);
                String fileExtension = mimeType.substring(mimeType.indexOf('/') + 1);
                String fileName = "images/exam/" + examId + "/" + UUID.randomUUID().toString() + "." + fileExtension;
                String newImageUrl = s3UploadService.uploadBase64(fileName, imageBytes, mimeType);

                // Replace the data URI with the new S3 URL in the img tag
                // Use a proper escaping for replacement string in appendReplacement
                String newImgTag = Matcher.quoteReplacement(fullImgTag.replace(dataUri, newImageUrl));
                matcher.appendReplacement(sb, newImgTag);
            } catch (IllegalArgumentException e) {
                System.err.println("Failed to decode base64 image: " + e.getMessage());
                matcher.appendReplacement(sb, Matcher.quoteReplacement(fullImgTag)); // Keep original if decoding fails
            }
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    @Transactional
    public void deleteExam(Long id) {
        // 1. 시험 조회
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new CustomException("시험을 찾을 수 없습니다. ID: " + id));

        // 2. 시험 내용에서 S3 이미지 삭제
        deleteImagesFromContent(exam.getContent());

        // 3. 시험 삭제
        examRepository.deleteById(id);
    }

    private void deleteImagesFromContent(String content) {
        if (content == null || content.isEmpty()) {
            return;
        }

        // S3 URL 패턴 찾기 (exam-images/ 와 images/exam/ 모두 포함)
        Pattern pattern = Pattern.compile("<img[^>]+src=\"([^\"]*(?:exam-images|images/exam)/[^\"]+)\"");
        Matcher matcher = pattern.matcher(content);

        while (matcher.find()) {
            String imageUrl = matcher.group(1);

            try {
                // URL에서 파일 경로 추출
                String filePath = extractFilePathFromUrl(imageUrl);

                if (filePath != null && !filePath.isEmpty()) {
                    System.out.println("Deleting S3 image: " + filePath);
                    s3UploadService.delete(filePath);
                    System.out.println("Successfully deleted S3 image: " + filePath);
                }
            } catch (Exception e) {
                System.err.println("Failed to delete S3 image: " + imageUrl + ", Error: " + e.getMessage());
                // 이미지 삭제 실패해도 계속 진행 (시험 삭제는 성공하도록)
            }
        }
    }

    private String extractFilePathFromUrl(String imageUrl) {
        int examImagesIndex = imageUrl.indexOf("exam-images/");
        if (examImagesIndex != -1) {
            return imageUrl.substring(examImagesIndex);
        }
        int imagesExamIndex = imageUrl.indexOf("images/exam/");
        if (imagesExamIndex != -1) {
            return imageUrl.substring(imagesExamIndex);
        }
        return null;
    }

    @Transactional
    public Exam updateExam(Long id, ExamSaveRequestDTO requestDTO) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new CustomException("시험을 찾을 수 없습니다. ID: " + id));

        // 1. Delete old images from S3
        deleteImagesFromContent(exam.getContent());

        String newContent;
        int newQuestionCount;

        // 2. Generate new content based on input
        if (requestDTO.getProblemIds() != null && !requestDTO.getProblemIds().isEmpty()) {
            // New logic: build from problem IDs
            newQuestionCount = requestDTO.getProblemIds().size();
            StringBuilder contentBuilder = new StringBuilder();
            List<Problem> problems = requestDTO.getProblemIds().stream()
                    .map(problemId -> problemRepository.findById(problemId)
                            .orElseThrow(() -> new CustomException("문제를 찾을 수 없습니다. ID: " + problemId)))
                    .collect(Collectors.toList());

            for (Problem problem : problems) {
                contentBuilder.append("<h2>문제 ").append(problem.getId()).append("</h2>");
                contentBuilder.append(problem.getContent());

                if (problem.getImageUrl() != null && !problem.getImageUrl().isEmpty()) {
                    String newImageUrl = s3UploadService.copyImage(problem.getImageUrl(), "images/exam/" + id);
                    contentBuilder.append("<img src=\"").append(newImageUrl).append("\" alt=\"문제 이미지\" />");
                }

                if ("객관식".equals(problem.getType().name()) && problem.getOptions() != null && !problem.getOptions().isEmpty()) {
                    contentBuilder.append("<h3>보기</h3><ul>");
                    problem.getOptions().forEach(option ->
                            contentBuilder.append("<li>").append(option.getContent()).append("</li>")
                    );
                    contentBuilder.append("</ul>");
                }
                contentBuilder.append("<p><strong>정답:</strong> ").append(problem.getAnswer()).append("</p><hr>");
            }
            newContent = contentBuilder.toString();
        } else {
            // Old logic: process raw content
            newQuestionCount = requestDTO.getQuestionCount();
            newContent = processAndUploadImages(requestDTO.getContent(), id);
        }

        // 3. Update exam entity
        exam.updateExam(requestDTO.getTitle(), newContent, newQuestionCount);
        return examRepository.save(exam);
    }
}
