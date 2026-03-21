package com.orionkey.service.impl;

import com.orionkey.service.WechatPayService;
import com.wechat.pay.java.core.RSAPublicKeyConfig;
import com.wechat.pay.java.core.notification.NotificationParser;
import com.wechat.pay.java.core.notification.RequestParam;
import com.wechat.pay.java.service.payments.model.Transaction;
import com.wechat.pay.java.service.payments.nativepay.NativePayService;
import com.wechat.pay.java.service.payments.nativepay.model.Amount;
import com.wechat.pay.java.service.payments.nativepay.model.PrepayRequest;
import com.wechat.pay.java.service.payments.nativepay.model.PrepayResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service
public class WechatPayServiceImpl implements WechatPayService {

    @Override
    public NativePaymentResult createNativePayment(WxpayConfig config, String outTradeNo,
                                                   String description, BigDecimal amount) {
        NativePayService service = new NativePayService.Builder().config(buildConfig(config)).build();
        PrepayRequest request = new PrepayRequest();
        Amount requestAmount = new Amount();
        requestAmount.setTotal(toFen(amount));
        request.setAmount(requestAmount);
        request.setAppid(config.appid());
        request.setMchid(config.mchid());
        request.setDescription(description);
        request.setNotifyUrl(config.notifyUrl());
        request.setOutTradeNo(outTradeNo);
        PrepayResponse response = service.prepay(request);
        return new NativePaymentResult(response.getCodeUrl());
    }

    @Override
    public Transaction parseTransaction(WxpayConfig config, Map<String, String> headers, String body) {
        NotificationParser parser = new NotificationParser(buildConfig(config));
        RequestParam requestParam = new RequestParam.Builder()
                .serialNumber(resolveHeader(headers, "Wechatpay-Serial"))
                .nonce(resolveHeader(headers, "Wechatpay-Nonce"))
                .signature(resolveHeader(headers, "Wechatpay-Signature"))
                .timestamp(resolveHeader(headers, "Wechatpay-Timestamp"))
                .signType(resolveHeader(headers, "Wechatpay-Signature-Type"))
                .body(body)
                .build();
        try {
            return parser.parse(requestParam, Transaction.class);
        } catch (Exception e) {
            log.error("Wxpay parseTransaction failed: mchid={}, appid={}, serialNo={}, publicKeyId={}, bodyLength={}, headersPresent={}",
                    config.mchid(),
                    config.appid(),
                    config.serialNo(),
                    config.publicKeyId(),
                    body == null ? 0 : body.length(),
                    summarizeHeaders(headers),
                    e);
            throw e;
        }
    }

    private RSAPublicKeyConfig buildConfig(WxpayConfig config) {
        return new RSAPublicKeyConfig.Builder()
                .merchantId(config.mchid())
                .privateKeyFromPath(config.privateKeyPath())
                .publicKeyFromPath(config.publicKeyPath())
                .publicKeyId(config.publicKeyId())
                .merchantSerialNumber(config.serialNo())
                .apiV3Key(config.apiV3Key())
                .build();
    }

    private int toFen(BigDecimal amount) {
        return amount.movePointRight(2).intValueExact();
    }

    private String resolveHeader(Map<String, String> headers, String name) {
        if (headers == null || headers.isEmpty()) {
            return null;
        }
        String direct = headers.get(name);
        if (direct != null) {
            return direct;
        }
        for (var entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) {
                return entry.getValue();
            }
        }
        log.warn("Missing WeChat Pay header: {}", name);
        return null;
    }

    private String summarizeHeaders(Map<String, String> headers) {
        return String.format("serial=%s,nonce=%s,signature=%s,timestamp=%s,signType=%s",
                hasHeader(headers, "Wechatpay-Serial"),
                hasHeader(headers, "Wechatpay-Nonce"),
                hasHeader(headers, "Wechatpay-Signature"),
                hasHeader(headers, "Wechatpay-Timestamp"),
                hasHeader(headers, "Wechatpay-Signature-Type"));
    }

    private boolean hasHeader(Map<String, String> headers, String name) {
        if (headers == null || headers.isEmpty()) {
            return false;
        }
        if (headers.get(name) != null) {
            return true;
        }
        for (var entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name) && entry.getValue() != null) {
                return true;
            }
        }
        return false;
    }
}

