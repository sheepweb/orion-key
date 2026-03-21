package com.orionkey.service;

import com.wechat.pay.java.service.payments.model.Transaction;
import com.wechat.pay.java.service.refund.model.Refund;

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

    record QueryOrderResult(
            String transactionId,
            String outTradeNo,
            String tradeState,
            Integer totalFen,
            String successTime
    ) {}

    record RefundResult(
            String refundId,
            String outRefundNo,
            String status,
            Long refundFen,
            Long totalFen,
            String successTime
    ) {}

    NativePaymentResult createNativePayment(WxpayConfig config, String outTradeNo,
                                            String description, BigDecimal amount);

    QueryOrderResult queryOrderByOutTradeNo(WxpayConfig config, String outTradeNo);

    void closeOrder(WxpayConfig config, String outTradeNo);

    RefundResult createRefund(WxpayConfig config, String outTradeNo, String outRefundNo,
                              BigDecimal refundAmount, BigDecimal totalAmount, String reason);

    RefundResult queryRefundByOutRefundNo(WxpayConfig config, String outRefundNo);

    Transaction parseTransaction(WxpayConfig config, Map<String, String> headers, String body);
}

