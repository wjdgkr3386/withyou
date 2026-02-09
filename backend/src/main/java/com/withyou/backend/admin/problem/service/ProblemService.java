package com.withyou.backend.admin.problem.service;

import com.withyou.backend.common.exception.CustomException;
import com.withyou.backend.common.s3.S3UploadService;
import com.withyou.backend.admin.problem.dto.ProblemCreateRequest;
import com.withyou.backend.admin.problem.dto.ProblemSearchRequest;
import com.withyou.backend.admin.problem.dto.ProblemSearchResponse;
import com.withyou.backend.admin.problem.entity.Problem;
import com.withyou.backend.admin.problem.entity.ProblemType;
import com.withyou.backend.admin.problem.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.PageRequest;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final S3UploadService s3UploadService;

    /* ===========================
       문제 생성
    ============================ */
    public void create(ProblemCreateRequest request, MultipartFile image) {

        validate(request);

        String imageUrl = null;
        String uploadedKey = null;

        try {
            if (image != null && !image.isEmpty()) {
                UploadResult uploadResult = uploadImage(image);
                imageUrl = uploadResult.url();
                uploadedKey = uploadResult.key();
            }

            Problem problem = Problem.create(request, imageUrl);
            problemRepository.save(problem);

        } catch (Exception e) {
            // S3 롤백
            if (uploadedKey != null) {
                s3UploadService.delete(uploadedKey);
            }
            throw e;
        }
    }

    /* ===========================
       이미지 업로드
    ============================ */
    private UploadResult uploadImage(MultipartFile image) {

        validateImage(image);

        try {
            String folder = s3UploadService.getFolderByContentType(image.getContentType());
            String key = String.format(
                    "%s/problem/%s_%s",
                    folder,
                    UUID.randomUUID(),
                    image.getOriginalFilename()
            );

            String url = s3UploadService.upload(key, image);
            return new UploadResult(key, url);

        } catch (IOException e) {
            throw new IllegalStateException("이미지 업로드 실패", e);
        }
    }

    /* ===========================
       검증 로직
    ============================ */
    private void validate(ProblemCreateRequest request) {
        validateCommon(
                request.getType(),
                request.getOptions(),
                request.getAnswer()
        );
    }

    private void validateCommon(
            ProblemType type,
            List<String> options,
            String answer
    ) {
        if (type == ProblemType.객관식) {
            if (options == null || options.size() < 2) {
                throw new CustomException("객관식은 보기 2개 이상이 필요합니다.");
            }

            int ans;
            try {
                ans = Integer.parseInt(answer);
            } catch (NumberFormatException e) {
                throw new CustomException("객관식 정답은 숫자여야 합니다.");
            }

            if (ans < 1 || ans > options.size()) {
                throw new CustomException("정답 번호가 보기 범위를 벗어났습니다.");
            }
        } else {
            if (answer == null || answer.isBlank()) {
                throw new CustomException("정답을 입력해야 합니다.");
            }
        }
    }

    private void validateImage(MultipartFile image) {
        if (image.getContentType() == null ||
                !image.getContentType().startsWith("image/")) {
            throw new CustomException("이미지 파일만 업로드 가능합니다.");
        }

        // 5MB 제한
        if (image.getSize() > 5 * 1024 * 1024) {
            throw new CustomException("이미지 파일은 5MB 이하만 가능합니다.");
        }
    }

    /* ===========================
       내부 DTO (업로드 결과)
    ============================ */
    private record UploadResult(String key, String url) {}


    // ===========================
    // 검색 (필터 적용)
    // ===========================
    public ProblemSearchResponse search(ProblemSearchRequest request) {

        List<Problem> problems = problemRepository.findByFilterWithOptions(
                request.getGrade(),
                request.getCategory(),
                request.getDifficulty(),
                request.getType(),
                PageRequest.of(request.getPage(), 1)
        );

        if (problems.isEmpty()) {
            return null;
        }

        long totalCount = problemRepository.countByFilter(
                request.getGrade(),
                request.getCategory(),
                request.getDifficulty(),
                request.getType()
        );

        Problem problem = problems.get(0);

        return new ProblemSearchResponse(
                problem.getId(),
                problem.getGrade(),
                problem.getCategory(),
                problem.getContent(),
                problem.getType(),
                problem.getDifficulty(),
                problem.getAnswer(),
                problem.getImageUrl(),
                problem.getOptions(),
                totalCount,                // 전체 개수
                request.getPage() + 1      // 현재 순서 (0페이지면 1번)
        );
    }

    /* ===========================
       문제 수정
    ============================ */
    public void update(Long id, ProblemCreateRequest request, MultipartFile image) {

        // 1. 기존 문제 조회
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new CustomException("문제를 찾을 수 없습니다."));

        // 2. 검증
        validate(request);

        String newImageUrl = problem.getImageUrl();
        String uploadedKey = null;
        String oldImageKey = null;

        try {
            // 3. 새 이미지가 있는 경우
            if (image != null && !image.isEmpty()) {
                // 기존 이미지 키 저장 (나중에 삭제용)
                if (problem.getImageUrl() != null) {
                    oldImageKey = extractKeyFromUrl(problem.getImageUrl());
                }

                // 새 이미지 업로드
                UploadResult uploadResult = uploadImage(image);
                newImageUrl = uploadResult.url();
                uploadedKey = uploadResult.key();
            }

            // 4. 문제 업데이트
            problem.update(request, newImageUrl);
            problemRepository.save(problem);

            // 5. 성공 시 기존 이미지 삭제
            if (oldImageKey != null && uploadedKey != null) {
                s3UploadService.delete(oldImageKey);
            }

        } catch (Exception e) {
            // S3 롤백 - 새로 업로드한 이미지 삭제
            if (uploadedKey != null) {
                s3UploadService.delete(uploadedKey);
            }
            throw e;
        }
    }

    /* ===========================
       문제 삭제
    ============================ */
    public void delete(Long id) {

        // 1. 문제 조회
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new CustomException("문제를 찾을 수 없습니다."));

        // 2. 이미지가 있으면 S3에서 삭제
        if (problem.getImageUrl() != null) {
            String imageKey = extractKeyFromUrl(problem.getImageUrl());
            try {
                s3UploadService.delete(imageKey);
            } catch (Exception e) {
                // 이미지 삭제 실패해도 문제 삭제는 진행
                // 로그만 남기고 계속 진행
            }
        }

        // 3. 문제 삭제 (options는 CASCADE로 자동 삭제)
        problemRepository.delete(problem);
    }

    /* ===========================
       URL에서 S3 키 추출
    ============================ */
    private String extractKeyFromUrl(String url) {
        // URL 형식: https://bucket-name.s3.region.amazonaws.com/folder/problem/uuid_filename
        // 또는: https://cdn-domain/folder/problem/uuid_filename

        try {
            // CloudFront나 S3 URL에서 키 부분만 추출
            int keyStartIndex = url.indexOf(".com/");
            if (keyStartIndex != -1) {
                return url.substring(keyStartIndex + 5); // ".com/" 이후 부분
            }

            // 다른 형식의 URL인 경우 전체 URL 반환
            return url;
        } catch (Exception e) {
            return url;
        }
    }

}