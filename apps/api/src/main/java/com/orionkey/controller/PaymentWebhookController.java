package com.orionkey.controller;

import com.orionkey.service.WebhookService;
import com.wechat.pay.java.core.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/payments/webhook")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final WebhookService webhookService;

    /**
     * 易支付 GET callback — returns plain text "SUCCESS"
     */
    @GetMapping(value = "/epay", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handleEpayCallback(@RequestParam Map<String, String> params) {
        log.info("Epay callback received: {}", params);
        String result = webhookService.processEpayCallback(params);
        return ResponseEntity.ok(result);
    }

    /**
     * Qiupay 回调 — POST form-urlencoded，返回纯文本 success/fail
     */
    @PostMapping(value = "/qiupay", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handleQiupayCallback(@RequestParam Map<String, String> params) {
        log.info("Qiupay callback received: {}", params);
        String result = webhookService.processQiupayCallback(params);
        return ResponseEntity.ok(result);
    }

    /**
     * CatPay 支付成功回调 — POST JSON，返回纯文本 success/fail
     */
    @PostMapping(value = "/catpay", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handleCatPayCallback(@RequestBody Map<String, Object> params) {
        log.info("CatPay callback received: {}", params);
        String result = webhookService.processCatPayCallback(params);
        return ResponseEntity.ok(result);
    }

    /**
     * 微信支付 API v3 回调。
     */
    @PostMapping(value = "/wxpay", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> handleWxpayCallback(
            @RequestHeader Map<String, String> headers,
            @RequestBody String body) {
        try {
            String result = webhookService.processWxpayCallback(headers, body);
            return ResponseEntity.ok(Map.of("code", result, "message", "成功"));
        } catch (ValidationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("code", "FAIL", "message", "签名验证失败"));
        } catch (Exception e) {
            log.error("Wxpay callback handling failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("code", "FAIL", "message", "处理失败"));
        }
    }

    /**
     * 微信退款回调。
     */
    @PostMapping(value = "/wxpay/refund", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> handleWxpayRefundCallback(
            @RequestHeader Map<String, String> headers,
            @RequestBody String body) {
        try {
            String result = webhookService.processWxpayRefundCallback(headers, body);
            return ResponseEntity.ok(Map.of("code", result, "message", "成功"));
        } catch (ValidationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("code", "FAIL", "message", "签名验证失败"));
        } catch (Exception e) {
            log.error("Wxpay refund callback handling failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("code", "FAIL", "message", "处理失败"));
        }
    }

    /**
     * BEpusdt USDT 支付回调 — POST JSON，返回 "ok" 表示成功
     */
    @PostMapping(value = "/usdt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> handleBepusdtCallback(@RequestBody Map<String, Object> params) {
        log.info("BEpusdt callback received: {}", params);
        String result = webhookService.processBepusdtCallback(params);
        return ResponseEntity.ok(result);
    }
}
