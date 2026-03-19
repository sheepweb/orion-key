package com.orionkey.service.impl;

import com.orionkey.constant.ErrorCode;
import com.orionkey.exception.BusinessException;
import com.orionkey.service.WechatPayCertStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
public class WechatPayCertStorageServiceImpl implements WechatPayCertStorageService {

    private static final long MAX_FILE_SIZE = 64 * 1024;

    @Value("${wxpay.cert-upload.path:./secure/wechatpay-certs}")
    private String certUploadPath;

    @Override
    public UploadResult storePemFile(String kind, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "证书文件不能为空");
        }
        String normalizedKind = normalizeKind(kind);
        validateFileMeta(file);
        String content = readContent(file);
        validatePemContent(normalizedKind, content);

        Path baseDir = resolveBaseDir();
        Path targetDir = baseDir.resolve(normalizedKind);
        try {
            Files.createDirectories(targetDir);
            String filename = normalizedKind + "-" + UUID.randomUUID() + ".pem";
            Path target = targetDir.resolve(filename).normalize();
            Files.writeString(target, content, StandardCharsets.UTF_8);
            log.info("Stored WeChat Pay PEM file: kind={}, path={}", normalizedKind, target);
            return new UploadResult(target.toString(), file.getOriginalFilename());
        } catch (IOException e) {
            log.error("Store WeChat Pay PEM file failed: kind={}", normalizedKind, e);
            throw new BusinessException(ErrorCode.SERVER_ERROR, "微信支付证书文件保存失败");
        }
    }

    private String normalizeKind(String kind) {
        if (kind == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "缺少证书类型");
        }
        return switch (kind.trim().toLowerCase(Locale.ROOT)) {
            case "public_key", "public" -> "public_key";
            case "private_key", "private" -> "private_key";
            default -> throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的证书类型，仅支持 public_key/private_key");
        };
    }

    private void validateFileMeta(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase(Locale.ROOT).endsWith(".pem")) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "仅支持上传 .pem 文件");
        }
        if (file.getSize() <= 0 || file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "PEM 文件大小必须在 1B 到 64KB 之间");
        }
    }

    private String readContent(MultipartFile file) {
        try {
            return new String(file.getBytes(), StandardCharsets.UTF_8).trim();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.SERVER_ERROR, "读取证书文件失败");
        }
    }

    private void validatePemContent(String kind, String content) {
        boolean basicPem = content.contains("-----BEGIN ") && content.contains("-----END ");
        if (!basicPem) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "文件内容不是有效的 PEM 格式");
        }
        if ("public_key".equals(kind) && !content.contains("BEGIN PUBLIC KEY")) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "平台公钥文件必须包含 PUBLIC KEY");
        }
        if ("private_key".equals(kind)
                && !content.contains("BEGIN PRIVATE KEY")
                && !content.contains("BEGIN RSA PRIVATE KEY")) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "商户私钥文件必须包含 PRIVATE KEY");
        }
    }

    private Path resolveBaseDir() {
        Path path = Paths.get(certUploadPath);
        if (!path.isAbsolute()) {
            path = Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
        }
        return path;
    }
}

