package com.withyou.backend.notice;

import com.withyou.backend.common.ApiResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/notice")
@RestController
public class NoticeController {

    private NoticeService noticeService;

    public NoticeController(NoticeService noticeService){
        this.noticeService = noticeService;
    }

    @PostMapping(value = "/write", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> write(NoticeWriteDTO noticeWriteDTO){
        System.out.println("NoticeController - write");
        noticeService.write(noticeWriteDTO);
        return ResponseEntity.ok(ApiResponse.success("공지사항 생성 성공", null));
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<NoticeResponseDTO>>> getAllNotices() {
        System.out.println("NoticeController - getAllNotices");
        List<NoticeResponseDTO> noticeList = noticeService.getAllNotices();
        return ResponseEntity.ok(ApiResponse.success("공지사항 목록 조회 성공", noticeList));
    }

    @GetMapping("/detail/{id}")
    public ResponseEntity<ApiResponse<NoticeResponseDTO>> getNoticeDetail(@PathVariable Long id) {
        NoticeResponseDTO detail = noticeService.getNoticeDetail(id);
        return ResponseEntity.ok(ApiResponse.success("공지사항 상세 조회 성공", detail));
    }
}
