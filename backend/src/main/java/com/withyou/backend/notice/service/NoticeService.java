package com.withyou.backend.notice.service;

import com.withyou.backend.common.Util;
import com.withyou.backend.common.exception.CustomException;
import com.withyou.backend.common.s3.S3UploadService;
import com.withyou.backend.notice.dto.NoticeWriteDTO;
import com.withyou.backend.notice.dto.NoticeResponseDTO;
import com.withyou.backend.notice.entity.Notice;
import com.withyou.backend.notice.entity.NoticeFile;
import com.withyou.backend.notice.repository.NoticeRepository;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NoticeService {

    private NoticeRepository noticeRepository;
    private S3UploadService s3UploadService;
    private Util util;

    public NoticeService(NoticeRepository noticeRepository, S3UploadService s3UploadService, Util util) {
        this.noticeRepository = noticeRepository;
        this.s3UploadService = s3UploadService;
        this.util = util;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void write(NoticeWriteDTO noticeWriteDTO) {
        List<String> uploadedKeys = new ArrayList<>();

        try {
            // 기본 검증
            validateNotice(noticeWriteDTO);

            // 본문 이미지 치환 및 S3 저장 (images 폴더)
            String newHtmlSource = util.replaceHtmlContent(noticeWriteDTO.getContent(), "images", uploadedKeys);

            // Notice 객체 생성
            Notice notice = new Notice(
                    noticeWriteDTO.getTitle(),
                    newHtmlSource,
                    noticeWriteDTO.getIsImportant()
            );

            // 일반 첨부파일 처리 (중복 루프 제거 및 통합)
            if (noticeWriteDTO.getFiles() != null && !noticeWriteDTO.getFiles().isEmpty()) {
                for (MultipartFile file : noticeWriteDTO.getFiles()) {
                    if (file.isEmpty()) continue;


                    // S3 저장 경로(Key) 생성
                    String originalName = file.getOriginalFilename();
                    String extension = "";
                    if (originalName != null && originalName.contains(".")) {
                        extension = originalName.substring(originalName.lastIndexOf("."));
                    }
                    String typeFolder = s3UploadService.getFolderByContentType(file.getContentType());
                    String key = "attachments/" + typeFolder + "/" + UUID.randomUUID() + extension;

                    // S3 업로드 및 키 기록
                    String url = s3UploadService.upload(key, file);
                    uploadedKeys.add(key);

                    // DB 저장을 위해 NoticeFile 엔티티 생성 및 연관관계 설정
                    NoticeFile noticeFile = new NoticeFile(file.getOriginalFilename(), url, notice);
                    notice.addFile(noticeFile);
                }
            }

            // 최종 DB 저장 (Notice와 NoticeFile이 함께 저장됨)
            System.out.println(notice.getIsImportant());
            noticeRepository.save(notice);

        } catch (Exception e) {
            rollbackS3Uploads(uploadedKeys);
            throw new CustomException("공지사항 등록 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 검증 로직
    private void validateNotice(NoticeWriteDTO dto) {
        if (dto.getFiles() != null && dto.getFiles().size() > 10) throw new CustomException("파일은 최대 10개까지입니다.");
        if (dto.getTitle() == null || dto.getTitle().isBlank()) throw new CustomException("제목을 입력해주세요.");
    }

    // S3 롤백 로직
    private void rollbackS3Uploads(List<String> keys) {
        for (String key : keys) {
            try {
                s3UploadService.delete(key);
            } catch (Exception e) {
                System.err.println("S3 파일 삭제 실패 (롤백 중): " + key);
            }
        }
    }

    // 공지사항 조회
    @Transactional(readOnly = true)
    public List<NoticeResponseDTO> getAllNotices() {
        // 최신순 정렬 (ID 내림차순)
        List<Notice> notices = noticeRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));

        return notices.stream().map(notice -> new NoticeResponseDTO(
                notice.getId(),
                notice.getTitle(),
                notice.getContent(),
                notice.getIsImportant(),
                notice.getFiles().stream()
                        .map(file -> new NoticeResponseDTO.FileResponseDTO(
                                file.getOriginalName(),
                                file.getFileUrl()))
                        .toList()
        )).toList();
    }

    // 공지사항 상세 조회
    @Transactional(readOnly = true)
    public NoticeResponseDTO getNoticeDetail(Long id) {
        // ID로 공지사항 조회
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new CustomException("해당 공지사항을 찾을 수 없습니다."));

        // DTO로 변환하여 반환
        return new NoticeResponseDTO(
                notice.getId(),
                notice.getTitle(),
                notice.getContent(),
                notice.getIsImportant(),
                notice.getFiles().stream()
                        .map(file -> new NoticeResponseDTO.FileResponseDTO(
                                file.getOriginalName(),
                                file.getFileUrl()))
                        .toList()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void update(Long id, NoticeWriteDTO noticeWriteDTO) {
        List<String> uploadedKeys = new ArrayList<>();

        try {
            validateNotice(noticeWriteDTO);

            Notice notice = noticeRepository.findById(id)
                    .orElseThrow(() -> new CustomException("해당 공지사항을 찾을 수 없습니다."));

            // 본문 이미지 치환 및 S3 업로드
            String newHtmlSource = util.replaceHtmlContent(
                    noticeWriteDTO.getContent(),
                    "images",
                    uploadedKeys
            );

            // 기존 첨부파일 중 본문에서 사용되지 않는 파일만 삭제
            List<NoticeFile> filesToKeep = new ArrayList<>();
            for (NoticeFile oldFile : notice.getFiles()) {
                if (newHtmlSource.contains(oldFile.getFileUrl())) {
                    filesToKeep.add(oldFile);
                } else {
                    String url = oldFile.getFileUrl();
                    String key = url.substring(url.indexOf(".com/") + 5);
                    s3UploadService.delete(key);
                }
            }
            notice.getFiles().clear();
            filesToKeep.forEach(notice::addFile);

            // 새 첨부파일 등록
            if (noticeWriteDTO.getFiles() != null && !noticeWriteDTO.getFiles().isEmpty()) {
                for (MultipartFile file : noticeWriteDTO.getFiles()) {
                    if (file.isEmpty()) continue;

                    String originalName = file.getOriginalFilename();
                    String extension = "";
                    if (originalName != null && originalName.contains(".")) {
                        extension = originalName.substring(originalName.lastIndexOf("."));
                    }

                    String typeFolder = s3UploadService.getFolderByContentType(file.getContentType());
                    String key = "attachments/" + typeFolder + "/" + UUID.randomUUID() + extension;

                    String url = s3UploadService.upload(key, file);
                    uploadedKeys.add(key);

                    NoticeFile noticeFile = new NoticeFile(originalName, url, notice);
                    notice.addFile(noticeFile);
                }
            }

            // 공지사항 내용/제목/중요도 업데이트
            notice.update(
                    noticeWriteDTO.getTitle(),
                    newHtmlSource,
                    noticeWriteDTO.getIsImportant()
            );

        } catch (Exception e) {
            rollbackS3Uploads(uploadedKeys);
            throw new CustomException("공지사항 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 공지사항 삭제
    public void deleteNotice(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new CustomException("존재하지 않는 공지사항입니다. id: " + id);
        }
        noticeRepository.deleteById(id);
    }
}
