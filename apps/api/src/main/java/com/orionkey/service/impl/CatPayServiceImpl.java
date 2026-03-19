package com.orionkey.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionkey.constant.ErrorCode;
import com.orionkey.exception.BusinessException;
import com.orionkey.service.CatPayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CatPayServiceImpl implements CatPayService {

    private static final Map<String, String> KNOWN_ERROR_MESSAGES = Map.of(
            "进行中订单超限", "CatPay 下单失败：进行中订单过多，请稍后再试",
            "暂无可用设备", "CatPay 下单失败：当前暂无可用设备",
            "设备不支持微信支付", "CatPay 下单失败：当前设备不支持微信支付",
            "设备不支持支付宝支付", "CatPay 下单失败：当前设备不支持支付宝支付"
    );

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public CatPayOrderResult createPayment(CatPayConfig config, BigDecimal amount, String userId, String type,
                                           Map<String, Object> metadata) {
        Map<String, Object> req = new LinkedHashMap<>();
        req.put("amount", amount);
        req.put("userId", userId);
        req.put("type", type);
        if (config.apiKey() != null && !config.apiKey().isBlank()) req.put("apiKey", config.apiKey());
        if (config.webhookUrl() != null && !config.webhookUrl().isBlank()) req.put("webhookUrl", config.webhookUrl());
        if (metadata != null && !metadata.isEmpty()) req.put("metadata", metadata);
        Map<String, Object> body = postJson(buildBaseUrl(config.apiUrl()) + "/api/orders/create", req);
        return new CatPayOrderResult(
                text(body, "orderNo"), decimal(body, "expectedAmount"), decimal(body, "actualAmount"),
                decimal(body, "serviceFee"), text(body, "paymentLink"), text(body, "expiredAt"));
    }

    @Override
    public CatPayOrderQueryResult queryOrder(CatPayConfig config, String orderNo) {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(buildBaseUrl(config.apiUrl()) + "/api/orders/" + orderNo, String.class);
            return toQueryResult(parseBody(response.getBody()));
        } catch (Exception e) {
            log.warn("CatPay query order failed: orderNo={}, error={}", orderNo, e.getMessage());
            return null;
        }
    }

    private Map<String, Object> postJson(String url, Map<String, Object> req) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(req, headers), String.class);
            return parseBody(response.getBody());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("CatPay create order failed: {}", e.getMessage());
            throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "CatPay 下单失败，请稍后重试");
        }
    }

    private Map<String, Object> parseBody(String body) {
        if (body == null || body.isBlank()) {
            throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "CatPay 响应为空");
        }
        try {
            Map<String, Object> result = objectMapper.readValue(body, new TypeReference<>() {});
            String error = text(result, "error");
            if (error != null && !error.isBlank()) {
                throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE,
                        KNOWN_ERROR_MESSAGES.getOrDefault(error, "CatPay: " + error));
            }
            return result;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("CatPay response parse failed: {}", body);
            throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "CatPay 响应格式异常");
        }
    }

    @SuppressWarnings("unchecked")
    private CatPayOrderQueryResult toQueryResult(Map<String, Object> body) {
        return new CatPayOrderQueryResult(
                text(body, "orderNo"), decimal(body, "expectedAmount"), decimal(body, "actualAmount"),
                decimal(body, "serviceFee"), text(body, "type"), text(body, "status"), text(body, "paymentLink"),
                text(body, "webhookUrl"), body.get("metadata") instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of(),
                text(body, "createdAt"), text(body, "expiredAt"), text(body, "paidAt"));
    }

    private static String buildBaseUrl(String apiUrl) {
        return apiUrl.endsWith("/") ? apiUrl.substring(0, apiUrl.length() - 1) : apiUrl;
    }

    private static String text(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : value.toString();
    }

    private static BigDecimal decimal(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || value.toString().isBlank()) return null;
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

