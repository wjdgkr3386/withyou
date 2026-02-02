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

}
