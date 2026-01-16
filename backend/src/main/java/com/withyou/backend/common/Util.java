package com.withyou.backend.common;

import com.withyou.backend.common.s3.S3UploadService;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Component
public class Util {

    private final S3UploadService s3UploadService;

    public Util(S3UploadService s3UploadService){
        this.s3UploadService = s3UploadService;
    }

    // base64 형태의 HTML 코드와 s3 폴더 이름을 매개변수로 받아서
    // 이미지를 추출해서 s3 경로로 치환해서 반환
    public String replaceHtmlContent(String htmlContent, String folder, List<String> uploadedKeys) {
        if (htmlContent == null || htmlContent.isBlank()) return htmlContent;

        Document doc = Jsoup.parseBodyFragment(htmlContent);
        Elements imgs = doc.select("img");

        for (Element img : imgs) {
            String src = img.attr("src");

            if (src.startsWith("data:image")) {
                String[] parts = src.split(",");
                String metadata = parts[0];
                String base64Data = parts[1];
                String contentType = metadata.split(":")[1].split(";")[0];
                String extension = getExtension(contentType);
                byte[] decodedBytes = Base64.getDecoder().decode(base64Data);
                String key = folder + "/" + UUID.randomUUID() + "." + extension;
                String s3Url = s3UploadService.uploadBase64(key, decodedBytes, contentType);

                // 롤백을 위해 생성된 키 저장
                if (uploadedKeys != null) uploadedKeys.add(key);

                img.attr("src", s3Url);
            }
        }
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
