package com.orionkey.service;

import java.util.Map;

public interface WebhookService {

    String processWebhook(String channelCode, Map<String, Object> payload);

    /**
     * 处理易支付 GET 回调
     */
    String processEpayCallback(Map<String, String> params);
}
