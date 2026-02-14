package com.withyou.backend.common.s3;

import java.io.IOException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class S3UploadService {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;
    @Value("${cloud.aws.region.static}")
    private String region;

    public S3UploadService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public String upload(String key, MultipartFile file) throws IOException {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(
                request,
                RequestBody.fromBytes(file.getBytes())
        );

        return "https://" + bucket + ".s3.amazonaws.com/" + key;
    }

    public String copyImage(String sourceUrl, String destPath) {
        if (sourceUrl == null || sourceUrl.isEmpty()) {
            return null;
        }

        String sourceKey = sourceUrl.substring(sourceUrl.indexOf("images/"));
        String fileName = sourceKey.substring(sourceKey.lastIndexOf("/") + 1);
        String destinationKey = destPath + "/" + fileName;

        CopyObjectRequest copyReq = CopyObjectRequest.builder()
                .sourceBucket(bucket)
                .sourceKey(sourceKey)
                .destinationBucket(bucket)
                .destinationKey(destinationKey)
                .build();

        s3Client.copyObject(copyReq);

        return "https://" + bucket + ".s3.amazonaws.com/" + destinationKey;
    }

    public void delete(String key) {
        s3Client.deleteObject(builder ->
                builder.bucket(bucket).key(key)
        );
    }

    public String uploadBase64(String key, byte[] fileBytes, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(fileBytes));

        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, key);
    }


    public String getFolderByContentType(String contentType) {
        if (contentType == null) return "others";

        // images: jpg, png, gif, webp, svg 등
        if (contentType.startsWith("image/")) return "images";

        // videos: mp4, mov, avi, webm 등
        if (contentType.startsWith("video/")) return "videos";

        // audios: mp3, wav, ogg, aac 등
        if (contentType.startsWith("audio/")) return "audios";

        // documents: txt, pdf, doc, docx, xls, xlsx, ppt, pptx 등
        if (contentType.startsWith("text/") || contentType.contains("application/pdf") || contentType.contains("msword") || contentType.contains("officedocument")) {
            return "documents";
        }

        // archives: zip, 7z, rar, tar, gz 등
        if (contentType.contains("zip") || contentType.contains("compressed")) {
            return "archives";
        }

        return "others";
    }
}