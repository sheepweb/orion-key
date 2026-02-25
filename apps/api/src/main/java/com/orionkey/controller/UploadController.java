package com.orionkey.controller;

import com.orionkey.common.ApiResponse;
import com.orionkey.constant.ErrorCode;
import com.orionkey.exception.BusinessException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/upload")
public class UploadController {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"
    );

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "image/bmp", "image/svg+xml"
    );

    @Value("${upload.path:./uploads}")
    private String uploadPath;

    @Value("${upload.url-prefix:/uploads}")
    private String urlPrefix;

    private Path resolvedUploadDir;

    @PostConstruct
    public void init() throws IOException {
        Path dir = Paths.get(uploadPath);
        if (!dir.isAbsolute()) {
            dir = Paths.get(System.getProperty("user.dir")).resolve(uploadPath).normalize();
        }
        this.resolvedUploadDir = dir;
        if (!Files.exists(this.resolvedUploadDir)) {
            Files.createDirectories(this.resolvedUploadDir);
        }
        log.info("Upload directory resolved to: {}", this.resolvedUploadDir);
    }

    @PostMapping("/image")
    public ApiResponse<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "文件不能为空");
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的图片格式，仅支持 JPG/PNG/GIF/WebP/BMP/SVG");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        // Validate file extension
        if (extension.isEmpty() || !ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的文件扩展名，仅支持 jpg/png/gif/webp/bmp/svg");
        }

        String filename = UUID.randomUUID() + extension;

        try {
            Path target = resolvedUploadDir.resolve(filename);
            file.transferTo(target.toFile());
            log.info("File uploaded: {}", target);

            String url = urlPrefix + "/" + filename;
            return ApiResponse.success(Map.of("url", url));
        } catch (IOException e) {
            log.error("File upload failed", e);
            throw new BusinessException(ErrorCode.SERVER_ERROR, "文件上传失败");
        }
    }
}
