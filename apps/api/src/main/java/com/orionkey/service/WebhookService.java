package com.orionkey.service;

import java.util.Map;

public interface WebhookService {

    /**
     * 处理易支付 GET 回调
     */
    String processEpayCallback(Map<String, String> params);

    /**
     * 处理 Qiupay POST form-urlencoded 回调
     */
    String processQiupayCallback(Map<String, String> params);

    /**
     * 处理 CatPay 支付成功回调（JSON body）
     */
    String processCatPayCallback(Map<String, Object> params);

    /**
     * 处理微信支付 API v3 回调（原始 body + 签名头）
     */
    String processWxpayCallback(Map<String, String> headers, String body);

    /**
     * 处理 BEpusdt USDT 支付回调（JSON body，含非 String 类型字段如 amount/status）
     */
    String processBepusdtCallback(Map<String, Object> params);
}
