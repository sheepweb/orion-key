package com.orionkey.service;

import com.wechat.pay.java.service.payments.model.Transaction;

import java.math.BigDecimal;
import java.util.Map;

public interface WechatPayService {

    record WxpayConfig(
            String appid,
            String mchid,
            String apiV3Key,
            String serialNo,
            String privateKeyPath,
            String notifyUrl,
            String publicKeyId,
            String publicKeyPath
    ) {}

    record NativePaymentResult(String codeUrl) {}

    NativePaymentResult createNativePayment(WxpayConfig config, String outTradeNo,
                                            String description, BigDecimal amount);

    Transaction parseTransaction(WxpayConfig config, Map<String, String> headers, String body);
}

