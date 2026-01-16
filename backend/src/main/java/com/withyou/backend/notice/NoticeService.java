package com.withyou.backend.notice;

import com.withyou.backend.common.Util;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NoticeService {

    private NoticeRepository noticeRepository;
    private Util util;

    public NoticeService(NoticeRepository noticeRepository, Util util) {
        this.noticeRepository = noticeRepository;
        this.util = util;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void write(NoticeWriteDTO noticeWriteDTO){

        // 제목 없을 경우 에러 발생
        if(noticeWriteDTO.getTitle()==null || noticeWriteDTO.getTitle().isBlank()){
            throw new RuntimeException("제목을 입력해주세요.");
        }

        // HTML 태그 및 공백 엔티티 제거 로직 추가
        String content = noticeWriteDTO.getContent();
        String pureText = "";

        if (content != null) {
            pureText = content.replaceAll("<[^>]*>", "") // 모든 HTML 태그 제거
                    .replace("&nbsp;", "")     // 공백 엔티티 제거
                    .trim();                   // 양끝 공백 제거
        }

        // 텍스트도 없고 이미지도 없는 경우 에러 발생
        if(pureText.isEmpty() && (content == null || !content.contains("<img"))){
            throw new RuntimeException("내용을 입력해주세요.");
        }

        // baseUrl을 이미지 형태로 치환 후 s3에 저장
        String newHtmlSource =  util.replaceHtmlContent(noticeWriteDTO.getContent(), "images");
        
        Notice notice = new Notice(
            noticeWriteDTO.getTitle(),
            newHtmlSource,
            noticeWriteDTO.isImportant()
        );

        noticeRepository.save(notice);
    }
}
