package com.orionkey.service;

import org.springframework.web.multipart.MultipartFile;

public interface WechatPayCertStorageService {

    record UploadResult(String storedPath, String originalFilename) {}

    UploadResult storePemFile(String kind, MultipartFile file);
}

