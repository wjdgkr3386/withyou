package com.withyou.backend.common;

import com.withyou.backend.common.s3.S3UploadService;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.UUID;

@Component
public class Util {

    private final S3UploadService s3UploadService;

    public Util(S3UploadService s3UploadService){
        this.s3UploadService = s3UploadService;
    }

    // base64 형태의 HTML 코드와 s3 폴더 이름을 매개변수로 받아서
    // 이미지를 추출해서 s3 경로로 치환해서 반환
    public String replaceHtmlContent(String htmlContent, String folder) {
        if (htmlContent == null || htmlContent.isBlank()) return htmlContent;

        // HTML 파싱
        Document doc = Jsoup.parseBodyFragment(htmlContent);
        Elements imgs = doc.select("img");

        for (Element img : imgs) {
            String src = img.attr("src");

            // Base64 이미지인 경우 처리
            if (src.startsWith("data:image")) {
                String[] parts = src.split(",");
                String metadata = parts[0];
                String base64Data = parts[1];

                // 확장자 및 컨텐츠 타입 추출
                String contentType = metadata.split(":")[1].split(";")[0];
                String extension = getExtension(contentType);

                // 디코딩 및 S3 업로드
                byte[] decodedBytes = Base64.getDecoder().decode(base64Data);
                String key = folder + "/" + UUID.randomUUID() + "." + extension;

                // S3UploadService를 이용해 실제 저장
                String s3Url = s3UploadService.uploadBase64(key, decodedBytes, contentType);

                // 태그의 src를 S3 URL로 교체
                img.attr("src", s3Url);
            }
        }
        // body 안의 내용만 반환
        return doc.body().html();
    }

    // 확장자 추출 헬퍼 메서드
    private String getExtension(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/gif" -> "gif";
            case "image/webp" -> "webp";
            default -> "png";
        };
    }

}
