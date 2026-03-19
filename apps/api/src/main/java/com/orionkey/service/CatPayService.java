package com.orionkey.service;

import java.math.BigDecimal;
import java.util.Map;

public interface CatPayService {

    /**
     * CatPay 渠道配置（从 PaymentChannel.configData 解析）
     */
    record CatPayConfig(String apiUrl, String apiKey, String webhookUrl, String type) {}

    /**
     * 创建订单返回结果
     */
    record CatPayOrderResult(
            String orderNo,
            BigDecimal expectedAmount,
            BigDecimal actualAmount,
            BigDecimal serviceFee,
            String paymentLink,
            String expiredAt
    ) {}

    /**
     * 查询订单结果
     */
    record CatPayOrderQueryResult(
            String orderNo,
            BigDecimal expectedAmount,
            BigDecimal actualAmount,
            BigDecimal serviceFee,
            String type,
            String status,
            String paymentLink,
            String webhookUrl,
            Map<String, Object> metadata,
            String createdAt,
            String expiredAt,
            String paidAt
    ) {}

    CatPayOrderResult createPayment(CatPayConfig config, BigDecimal amount, String userId, String type,
                                    Map<String, Object> metadata);

    CatPayOrderQueryResult queryOrder(CatPayConfig config, String orderNo);
}

