package com.withyou.backend.notice.contoller;

import com.withyou.backend.common.ApiResponse;
import com.withyou.backend.notice.dto.NoticeResponseDTO;
import com.withyou.backend.notice.service.NoticeService;
import com.withyou.backend.notice.dto.NoticeWriteDTO;
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

    @PutMapping(value = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            NoticeWriteDTO noticeWriteDTO
    ) {
        System.out.println("NoticeController - update");
        noticeService.update(id, noticeWriteDTO);
        return ResponseEntity.ok(ApiResponse.success("공지사항 수정 성공", null));
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

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotice(@PathVariable Long id){
        noticeService.deleteNotice(id);
        return ResponseEntity.ok(ApiResponse.success("공지사항 삭제 성공", null));
    }

}
