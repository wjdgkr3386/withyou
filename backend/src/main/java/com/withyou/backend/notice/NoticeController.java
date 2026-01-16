package com.withyou.backend.notice;

import com.withyou.backend.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/api/notice")
@RestController
public class NoticeController {

    private NoticeService noticeService;

    public NoticeController(NoticeService noticeService){
        this.noticeService = noticeService;
    }

    @PostMapping("/write")
    public ResponseEntity<ApiResponse<Void>> write(@RequestBody NoticeWriteDTO noticeWriteDTO){
        System.out.println("NoticeController - write");
        noticeService.write(noticeWriteDTO);
        return ResponseEntity.ok(ApiResponse.success("공지사항 생성 성공", null));
    }
}
