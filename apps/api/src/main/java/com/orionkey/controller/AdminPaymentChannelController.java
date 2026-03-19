package com.orionkey.controller;

import com.orionkey.annotation.LogOperation;
import com.orionkey.common.ApiResponse;
import com.orionkey.service.AdminPaymentChannelService;
import com.orionkey.service.WechatPayCertStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/payment-channels")
@RequiredArgsConstructor
public class AdminPaymentChannelController {

    private final AdminPaymentChannelService adminPaymentChannelService;
    private final WechatPayCertStorageService wechatPayCertStorageService;

    @GetMapping
    public ApiResponse<?> listChannels() {
        return ApiResponse.success(adminPaymentChannelService.listChannels());
    }

    @LogOperation(action = "payment.create", targetType = "PAYMENT_CHANNEL", detail = "'创建支付渠道'")
    @PostMapping
    public ApiResponse<Void> createChannel(@RequestBody Map<String, Object> request) {
        adminPaymentChannelService.createChannel(request);
        return ApiResponse.success();
    }

    @LogOperation(action = "payment.update", targetType = "PAYMENT_CHANNEL", targetId = "#id", detail = "'修改支付渠道'")
    @PutMapping("/{id}")
    public ApiResponse<Void> updateChannel(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        adminPaymentChannelService.updateChannel(id, request);
        return ApiResponse.success();
    }

    @LogOperation(action = "payment.delete", targetType = "PAYMENT_CHANNEL", targetId = "#id", detail = "'删除支付渠道'")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteChannel(@PathVariable UUID id) {
        adminPaymentChannelService.deleteChannel(id);
        return ApiResponse.success();
    }

    @LogOperation(action = "payment.upload_cert", targetType = "PAYMENT_CHANNEL", detail = "'上传微信支付证书文件'")
    @PostMapping(value = "/upload-cert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> uploadWxpayCert(
            @RequestParam("kind") String kind,
            @RequestParam("file") MultipartFile file) {
        WechatPayCertStorageService.UploadResult result = wechatPayCertStorageService.storePemFile(kind, file);
        return ApiResponse.success(Map.of(
                "path", result.storedPath(),
                "filename", result.originalFilename()
        ));
    }
}
