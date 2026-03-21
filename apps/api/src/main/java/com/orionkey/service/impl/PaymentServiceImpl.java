package com.orionkey.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionkey.constant.ErrorCode;
import com.orionkey.entity.Order;
import com.orionkey.entity.OrderItem;
import com.orionkey.entity.PaymentChannel;
import com.orionkey.entity.WebhookEvent;
import com.orionkey.exception.BusinessException;
import com.orionkey.repository.OrderItemRepository;
import com.orionkey.repository.OrderRepository;
import com.orionkey.repository.PaymentChannelRepository;
import com.orionkey.repository.WebhookEventRepository;
import com.orionkey.service.BepusdtService;
import com.orionkey.service.BepusdtService.BepusdtConfig;
import com.orionkey.service.BepusdtService.BepusdtPaymentResult;
import com.orionkey.service.CatPayService;
import com.orionkey.service.CatPayService.CatPayConfig;
import com.orionkey.service.CatPayService.CatPayOrderResult;
import com.orionkey.service.EpayService;
import com.orionkey.service.EpayService.ChannelConfig;
import com.orionkey.service.EpayService.EpayResult;
import com.orionkey.service.PaymentService;
import com.orionkey.service.WechatPayService;
import com.orionkey.service.WechatPayService.NativePaymentResult;
import com.orionkey.service.WechatPayService.QueryOrderResult;
import com.orionkey.service.WechatPayService.RefundResult;
import com.orionkey.service.WechatPayService.WxpayConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    /** channel_code → 易支付 type 映射（仅 provider_type=epay 时使用） */
    private static final Map<String, String> EPAY_TYPE_MAP = Map.of(
            "alipay", "alipay",
            "wechat", "wxpay"
    );

    private static final String QIUPAY_ALIPAY_CHANNEL_CODE = "qiupay_alipay";
    private static final String WXPAY_CHANNEL_CODE = "wechat";
    private static final String WXPAY_PROVIDER_TYPE = "native_wxpay";
    private static final int REPAY_COOLDOWN_SECONDS = 10;
    private static final int RECONCILE_PENDING_MINUTES = 2;

    private final PaymentChannelRepository paymentChannelRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final WebhookEventRepository webhookEventRepository;
    private final EpayService epayService;
    private final BepusdtService bepusdtService;
    private final CatPayService catPayService;
    private final WechatPayService wechatPayService;
    private final ObjectMapper objectMapper;

    @Override
    public Map<String, Object> createPayment(UUID orderId, String paymentMethod, BigDecimal amount) {
        return createPayment(orderId, paymentMethod, amount, null);
    }

    @Override
    public Map<String, Object> createPayment(UUID orderId, String paymentMethod, BigDecimal amount, String device) {
        // 1. 查找渠道并验证已启用
        PaymentChannel channel = paymentChannelRepository.findByChannelCodeAndIsDeleted(paymentMethod, 0)
                .filter(PaymentChannel::isEnabled)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "支付渠道不可用"));

        // 2. 查找订单
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在"));

        // 3. 幂等：已有支付URL直接返回（paymentUrl 或 qrcodeUrl 任一存在即可）
        if ((order.getPaymentUrl() != null && !order.getPaymentUrl().isEmpty())
                || (order.getQrcodeUrl() != null && !order.getQrcodeUrl().isEmpty())) {
            log.info("Returning cached payment URL for order: {}", orderId);
            return buildResult(order);
        }

        // 4. 按 providerType 路由到不同的支付实现
        String providerType = channel.getProviderType();
        switch (providerType) {
            case "epay" -> createEpayPayment(channel, order, paymentMethod, amount, device);
            case "qiupay" -> createQiupayPayment(channel, order, paymentMethod, amount, device);
            case "catpay" -> createCatPayPayment(channel, order, paymentMethod, amount);
            case "native_alipay" -> throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "原生支付宝支付尚未实现，请使用易支付渠道");
            case "native_wxpay" -> createWxpayPayment(channel, order, amount);
            case "usdt" -> createBepusdtPayment(channel, order, amount);
            default -> throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "不支持的支付提供商类型: " + providerType);
        }

        return buildResult(order);
    }

    /**
     * BEpusdt USDT 下单流程
     */
    private void createBepusdtPayment(PaymentChannel channel, Order order, BigDecimal amount) {
        BepusdtConfig config = buildBepusdtConfig(channel);
        String productName = buildProductName(order.getId());

        BepusdtPaymentResult result = bepusdtService.createPayment(
                config, order.getId().toString(), amount, productName);

        order.setPaymentUrl(result.paymentUrl());
        order.setUsdtWalletAddress(result.walletAddress());
        order.setUsdtCryptoAmount(result.cryptoAmount());
        order.setUsdtTradeId(result.tradeId());
        order.setUsdtChain(channel.getChannelCode());
        orderRepository.save(order);
    }

    /**
     * 从渠道的 config_data JSON 构建 BepusdtConfig。
     */
    public BepusdtConfig buildBepusdtConfig(PaymentChannel channel) {
        Map<String, String> cfg = parseConfigData(channel.getConfigData());

        String apiUrl = requireConfig(cfg, "api_url", channel.getChannelCode());
        String apiToken = requireConfig(cfg, "api_token", channel.getChannelCode());
        String notifyUrl = requireConfig(cfg, "notify_url", channel.getChannelCode());
        String redirectUrl = cfg.getOrDefault("redirect_url", "");
        String tradeType = cfg.getOrDefault("trade_type", "usdt.trc20");
        String fiat = cfg.getOrDefault("fiat", "CNY");
        int timeout = Integer.parseInt(cfg.getOrDefault("timeout", "900"));
        BigDecimal tolerance = new BigDecimal(cfg.getOrDefault("auto_approve_tolerance", "0.01"));
        BigDecimal upper = new BigDecimal(cfg.getOrDefault("manual_review_upper", "5.0"));
        String fixedRate = cfg.getOrDefault("fixed_rate", "");

        return new BepusdtConfig(apiUrl, apiToken, notifyUrl, redirectUrl,
                tradeType, fiat, timeout, tolerance, upper, fixedRate);
    }

    /**
     * 易支付下单流程
     */
    private void createEpayPayment(PaymentChannel channel, Order order, String paymentMethod, BigDecimal amount, String device) {
        String epayType = EPAY_TYPE_MAP.get(paymentMethod.toLowerCase());
        if (epayType == null) {
            throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "该渠道不支持易支付");
        }

        ChannelConfig config = buildChannelConfig(channel);
        String productName = buildProductName(order.getId());

        EpayResult epayResult = epayService.createPayment(
                config,
                order.getId().toString(),
                epayType,
                productName,
                amount,
                order.getClientIp(),
                device
        );

        // 分别存储：payUrl 是 H5 跳转链接，qrcodeUrl 是二维码 URL
        order.setPaymentUrl(epayResult.payUrl());
        order.setQrcodeUrl(epayResult.qrcodeUrl());
        order.setEpayTradeNo(epayResult.tradeNo());
        orderRepository.save(order);
    }

    /**
     * Qiupay 下单流程（协议与易支付一致，复用 EpayService 实现）
     */
    private void createQiupayPayment(PaymentChannel channel, Order order, String paymentMethod, BigDecimal amount, String device) {
        if (!QIUPAY_ALIPAY_CHANNEL_CODE.equalsIgnoreCase(paymentMethod)) {
            throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "Qiupay 仅支持 qiupay_alipay 渠道");
        }

        ChannelConfig config = buildChannelConfig(channel);
        String productName = buildProductName(order.getId());

        EpayResult epayResult = epayService.createPayment(
                config,
                order.getId().toString(),
                "alipay",
                productName,
                amount,
                order.getClientIp(),
                device
        );

        order.setPaymentUrl(epayResult.payUrl());
        order.setQrcodeUrl(epayResult.qrcodeUrl());
        order.setEpayTradeNo(epayResult.tradeNo());
        orderRepository.save(order);
    }

    /**
     * CatPay 下单流程
     */
    private void createCatPayPayment(PaymentChannel channel, Order order, String paymentMethod, BigDecimal amount) {
        CatPayConfig config = buildCatPayConfig(channel, paymentMethod);
        Map<String, Object> metadata = Map.of(
                "orderId", order.getId().toString(),
                "paymentMethod", paymentMethod
        );

        CatPayOrderResult result = catPayService.createPayment(
                config, amount, order.getId().toString(), config.type(), metadata);

        order.setPaymentUrl(result.paymentLink());
        order.setQrcodeUrl(null);
        order.setEpayTradeNo(result.orderNo());
        orderRepository.save(order);
    }

    /**
     * 原生微信 Native 下单流程。
     */
    private void createWxpayPayment(PaymentChannel channel, Order order, BigDecimal amount) {
        WxpayConfig config = buildWxpayConfig(channel);
        String productName = buildProductName(order.getId());
        String outTradeNo = buildWxpayOutTradeNo(order);
        NativePaymentResult result = wechatPayService.createNativePayment(
                config, outTradeNo, productName, amount);
        order.setWxOutTradeNo(outTradeNo);
        order.setQrcodeUrl(result.codeUrl());
        order.setPaymentUrl(result.codeUrl());
        orderRepository.save(order);
    }

    public WxpayConfig buildWxpayConfig(PaymentChannel channel) {
        Map<String, String> cfg = parseConfigData(channel.getConfigData());
        return new WxpayConfig(
                requireConfig(cfg, "appid", channel.getChannelCode()),
                requireConfig(cfg, "mchid", channel.getChannelCode()),
                requireConfig(cfg, "api_v3_key", channel.getChannelCode()),
                requireConfig(cfg, "serial_no", channel.getChannelCode()),
                requireConfig(cfg, "private_key_path", channel.getChannelCode()),
                requireConfig(cfg, "notify_url", channel.getChannelCode()),
                requireConfig(cfg, "public_key_id", channel.getChannelCode()),
                requireConfig(cfg, "public_key_path", channel.getChannelCode())
        );
    }

    /**
     * 从渠道的 config_data JSON 构建 EpayService.ChannelConfig。
     * 所有必填字段均从数据库渠道配置读取，缺失则抛出异常。
     */
    public ChannelConfig buildChannelConfig(PaymentChannel channel) {
        Map<String, String> cfg = parseConfigData(channel.getConfigData());

        String pid = requireConfig(cfg, "pid", channel.getChannelCode());
        String key = requireConfig(cfg, "key", channel.getChannelCode());
        String apiUrl = requireConfig(cfg, "api_url", channel.getChannelCode());
        String notifyUrl = requireConfig(cfg, "notify_url", channel.getChannelCode());
        String returnUrl = requireConfig(cfg, "return_url", channel.getChannelCode());

        return new ChannelConfig(pid, key, apiUrl, notifyUrl, returnUrl);
    }

    /**
     * 从渠道的 config_data JSON 构建 CatPay 配置。
     */
    public CatPayConfig buildCatPayConfig(PaymentChannel channel, String paymentMethod) {
        Map<String, String> cfg = parseConfigData(channel.getConfigData());
        String apiUrl = requireConfig(cfg, "api_url", channel.getChannelCode());
        String apiKey = cfg.getOrDefault("api_key", "");
        String webhookUrl = requireConfig(cfg, "webhook_url", channel.getChannelCode());
        String type = cfg.get("type");
        if (type == null || type.isBlank()) {
            String lower = paymentMethod == null ? "" : paymentMethod.toLowerCase();
            type = lower.contains("ali") ? "alipay" : "wechat";
        }
        return new CatPayConfig(apiUrl, apiKey, webhookUrl, type);
    }

    private Map<String, Object> buildResult(Order order) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("order_id", order.getId());
        // payment_url: 兼容旧逻辑，优先返回 qrcodeUrl（PC 二维码），fallback 到 paymentUrl（H5 跳转）
        String effectiveUrl = order.getQrcodeUrl() != null ? order.getQrcodeUrl() : order.getPaymentUrl();
        result.put("payment_url", effectiveUrl);
        result.put("qrcode_url", order.getQrcodeUrl());
        result.put("pay_url", order.getPaymentUrl());
        result.put("expires_at", order.getExpiresAt());

        // USDT 支付额外字段
        if (order.getUsdtWalletAddress() != null) {
            result.put("wallet_address", order.getUsdtWalletAddress());
            result.put("crypto_amount", order.getUsdtCryptoAmount());
            result.put("chain", order.getUsdtChain());
        }
        if (order.getWxOutTradeNo() != null) {
            result.put("wx_out_trade_no", order.getWxOutTradeNo());
        }
        if (order.getWxRefundNo() != null) {
            result.put("wx_refund_no", order.getWxRefundNo());
            result.put("refund_amount", order.getRefundAmount());
            result.put("refunded_at", order.getRefundedAt());
        }
        return result;
    }

    private String buildProductName(UUID orderId) {
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        if (items.isEmpty()) return "Orion Key 订单";
        String firstName = items.getFirst().getProductTitle();
        if (items.size() == 1) return firstName;
        return firstName + " 等" + items.size() + "件商品";
    }

    private Map<String, String> parseConfigData(String configData) {
        if (configData == null || configData.isBlank()) return Map.of();
        try {
            Map<String, Object> raw = objectMapper.readValue(configData, new TypeReference<>() {});
            Map<String, String> result = new LinkedHashMap<>();
            for (var entry : raw.entrySet()) {
                if (entry.getValue() != null) {
                    result.put(entry.getKey(), entry.getValue().toString());
                }
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to parse channel config_data: {}", e.getMessage());
            return Map.of();
        }
    }

    @Override
    @Transactional
    public Map<String, Object> repay(UUID orderId, String device, UUID requestUserId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在"));

        // F9: 归属校验 — 已登录用户只能 repay 自己的订单
        if (order.getUserId() != null && requestUserId != null
                && !order.getUserId().equals(requestUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作此订单");
        }

        if (order.getStatus() != com.orionkey.constant.OrderStatus.PENDING) {
            throw new BusinessException(ErrorCode.ORDER_EXPIRED, "订单状态不允许重新支付");
        }

        if (order.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            order.setStatus(com.orionkey.constant.OrderStatus.EXPIRED);
            orderRepository.save(order);
            throw new BusinessException(ErrorCode.ORDER_EXPIRED, "订单已过期");
        }

        // 频率限制：距上次更新不足 REPAY_COOLDOWN_SECONDS 秒则拒绝
        if (order.getUpdatedAt() != null
                && order.getUpdatedAt().plusSeconds(REPAY_COOLDOWN_SECONDS).isAfter(java.time.LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "操作过于频繁，请稍后再试");
        }

        // 清除旧支付信息，跳过幂等缓存
        order.setPaymentUrl(null);
        order.setQrcodeUrl(null);
        order.setEpayTradeNo(null);
        orderRepository.save(order);

        // 重新创建支付
        return createPayment(order.getId(), order.getPaymentMethod(), order.getActualAmount(), device);
    }

    @Override
    @Transactional
    public Map<String, Object> queryWxpayOrder(UUID orderId) {
        Order order = requireWxpayOrder(orderId);
        PaymentChannel channel = resolveWxpayChannel();
        QueryOrderResult result = wechatPayService.queryOrderByOutTradeNo(buildWxpayConfig(channel), requireWxOutTradeNo(order));
        applyWxpayQueryResult(order, result, "ADMIN_QUERY");
        orderRepository.save(order);
        saveWxpayAuditEvent(order, "ADMIN_QUERY", toAuditPayload(result));
        return buildWxpayOrderResult(order, result);
    }

    @Override
    @Transactional
    public void closeWxpayOrder(UUID orderId) {
        Order order = requireWxpayOrder(orderId);
        if (order.getStatus() != com.orionkey.constant.OrderStatus.PENDING) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "仅 PENDING 状态订单可关闭微信订单");
        }

        PaymentChannel channel = resolveWxpayChannel();
        String outTradeNo = requireWxOutTradeNo(order);
        wechatPayService.closeOrder(buildWxpayConfig(channel), outTradeNo);
        order.setStatus(com.orionkey.constant.OrderStatus.EXPIRED);
        order.setPaymentUrl(null);
        order.setQrcodeUrl(null);
        orderRepository.save(order);
        saveWxpayAuditEvent(order, "ADMIN_CLOSE", "outTradeNo=" + outTradeNo);
    }

    @Override
    @Transactional
    public Map<String, Object> refundWxpayOrder(UUID orderId, BigDecimal refundAmount, String reason) {
        Order order = requireWxpayPaidOrder(orderId);
        BigDecimal actualRefundAmount = refundAmount == null ? order.getActualAmount() : refundAmount;
        if (actualRefundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "退款金额必须大于 0");
        }
        if (actualRefundAmount.compareTo(order.getActualAmount()) > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "退款金额不能大于订单实付金额");
        }

        PaymentChannel channel = resolveWxpayChannel();
        String outTradeNo = requireWxOutTradeNo(order);
        String outRefundNo = buildWxpayRefundNo(order);
        String refundReason = reason == null || reason.isBlank() ? "后台发起退款" : reason.trim();
        RefundResult result = wechatPayService.createRefund(
                buildWxpayConfig(channel),
                outTradeNo,
                outRefundNo,
                actualRefundAmount,
                order.getActualAmount(),
                refundReason
        );
        order.setWxRefundNo(outRefundNo);
        order.setRefundAmount(actualRefundAmount);
        applyWxpayRefundResult(order, result);
        orderRepository.save(order);
        saveWxpayAuditEvent(order, "ADMIN_REFUND", toAuditPayload(result));
        return buildWxpayRefundResult(order, result);
    }

    @Override
    @Transactional
    public Map<String, Object> queryWxpayRefund(UUID orderId) {
        Order order = requireWxpayOrder(orderId);
        if (order.getWxRefundNo() == null || order.getWxRefundNo().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该订单尚未发起微信退款");
        }

        PaymentChannel channel = resolveWxpayChannel();
        RefundResult result = wechatPayService.queryRefundByOutRefundNo(buildWxpayConfig(channel), order.getWxRefundNo());
        applyWxpayRefundResult(order, result);
        orderRepository.save(order);
        saveWxpayAuditEvent(order, "ADMIN_REFUND_QUERY", toAuditPayload(result));
        return buildWxpayRefundResult(order, result);
    }

    @Override
    @Transactional
    public void reconcilePendingWxpayOrders() {
        PaymentChannel channel = resolveWxpayChannelOrNull();
        if (channel == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        List<Order> orders = orderRepository.findPendingWxpayOrdersForReconcile(
                WXPAY_CHANNEL_CODE,
                now.minusMinutes(RECONCILE_PENDING_MINUTES),
                now
        );

        for (Order order : orders) {
            try {
                QueryOrderResult result = wechatPayService.queryOrderByOutTradeNo(buildWxpayConfig(channel), requireWxOutTradeNo(order));
                applyWxpayQueryResult(order, result, "SCHEDULE_RECONCILE");
                orderRepository.save(order);
                saveWxpayAuditEvent(order, "SCHEDULE_RECONCILE", toAuditPayload(result));
            } catch (Exception e) {
                log.warn("Wxpay reconcile failed: orderId={}", order.getId(), e);
                saveWxpayAuditEvent(order, "SCHEDULE_RECONCILE_FAIL", e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public void closeExpiredWxpayOrders() {
        PaymentChannel channel = resolveWxpayChannelOrNull();
        LocalDateTime now = LocalDateTime.now();
        List<Order> orders = orderRepository.findExpiredWxpayOrders(WXPAY_CHANNEL_CODE, now);
        for (Order order : orders) {
            try {
                if (channel != null && order.getWxOutTradeNo() != null && !order.getWxOutTradeNo().isBlank()) {
                    wechatPayService.closeOrder(buildWxpayConfig(channel), order.getWxOutTradeNo());
                }
            } catch (Exception e) {
                log.warn("Wxpay close expired order remote call failed: orderId={}", order.getId(), e);
                saveWxpayAuditEvent(order, "SCHEDULE_CLOSE_REMOTE_FAIL", e.getMessage());
            }
            order.setStatus(com.orionkey.constant.OrderStatus.EXPIRED);
            order.setPaymentUrl(null);
            order.setQrcodeUrl(null);
            orderRepository.save(order);
            saveWxpayAuditEvent(order, "SCHEDULE_CLOSE", "expiredAt=" + order.getExpiresAt());
        }
    }

    private Order requireWxpayOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND, "订单不存在"));
        if (!WXPAY_CHANNEL_CODE.equalsIgnoreCase(order.getPaymentMethod())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "该订单不是微信支付订单");
        }
        return order;
    }

    private Order requireWxpayPaidOrder(UUID orderId) {
        Order order = requireWxpayOrder(orderId);
        if (order.getStatus() != com.orionkey.constant.OrderStatus.PAID
                && order.getStatus() != com.orionkey.constant.OrderStatus.DELIVERED) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "仅已支付订单可发起微信退款");
        }
        return order;
    }

    private String buildWxpayOutTradeNo(Order order) {
        if (order.getWxOutTradeNo() != null && !order.getWxOutTradeNo().isBlank()) {
            return order.getWxOutTradeNo();
        }
        return order.getId().toString().replace("-", "");
    }

    private String buildWxpayRefundNo(Order order) {
        if (order.getWxRefundNo() != null && !order.getWxRefundNo().isBlank()) {
            return order.getWxRefundNo();
        }
        return "RF" + order.getId().toString().replace("-", "");
    }

    private String requireWxOutTradeNo(Order order) {
        String outTradeNo = buildWxpayOutTradeNo(order);
        if (outTradeNo == null || outTradeNo.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "订单缺少微信商户订单号");
        }
        return outTradeNo;
    }

    private PaymentChannel resolveWxpayChannel() {
        PaymentChannel channel = resolveWxpayChannelOrNull();
        if (channel == null) {
            throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE, "微信 Native 支付渠道不可用");
        }
        return channel;
    }

    private PaymentChannel resolveWxpayChannelOrNull() {
        return paymentChannelRepository.findByChannelCodeAndIsDeleted(WXPAY_CHANNEL_CODE, 0)
                .filter(PaymentChannel::isEnabled)
                .filter(channel -> WXPAY_PROVIDER_TYPE.equals(channel.getProviderType()))
                .orElse(null);
    }

    private void applyWxpayQueryResult(Order order, QueryOrderResult result, String source) {
        if (result == null) {
            return;
        }

        if (result.outTradeNo() != null && !result.outTradeNo().isBlank() && order.getWxOutTradeNo() == null) {
            order.setWxOutTradeNo(result.outTradeNo());
        }
        if (result.transactionId() != null && !result.transactionId().isBlank()) {
            order.setEpayTradeNo(result.transactionId());
        }

        String tradeState = result.tradeState();
        if ("SUCCESS".equals(tradeState)) {
            if (order.getStatus() == com.orionkey.constant.OrderStatus.PENDING
                    || order.getStatus() == com.orionkey.constant.OrderStatus.EXPIRED) {
                order.setStatus(com.orionkey.constant.OrderStatus.PAID);
            }
            if (order.getPaidAt() == null) {
                order.setPaidAt(LocalDateTime.now());
            }
        } else if ("CLOSED".equals(tradeState) || "REVOKED".equals(tradeState) || "PAYERROR".equals(tradeState)) {
            if (order.getStatus() == com.orionkey.constant.OrderStatus.PENDING) {
                order.setStatus(com.orionkey.constant.OrderStatus.EXPIRED);
                order.setPaymentUrl(null);
                order.setQrcodeUrl(null);
            }
        }

        log.info("Wxpay query applied: source={}, orderId={}, tradeState={}, transactionId={}",
                source, order.getId(), tradeState, result.transactionId());
    }

    private void applyWxpayRefundResult(Order order, RefundResult result) {
        if (result == null) {
            return;
        }
        if (result.outRefundNo() != null && !result.outRefundNo().isBlank()) {
            order.setWxRefundNo(result.outRefundNo());
        }
        if (result.refundFen() != null) {
            order.setRefundAmount(BigDecimal.valueOf(result.refundFen(), 2));
        }
        if ("SUCCESS".equals(result.status()) && order.getRefundedAt() == null) {
            order.setRefundedAt(LocalDateTime.now());
        }
    }

    private Map<String, Object> buildWxpayOrderResult(Order order, QueryOrderResult result) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("order_id", order.getId());
        map.put("status", order.getStatus().name());
        map.put("paid_at", order.getPaidAt());
        map.put("wx_out_trade_no", order.getWxOutTradeNo());
        map.put("transaction_id", result.transactionId());
        map.put("trade_state", result.tradeState());
        map.put("total_fen", result.totalFen());
        map.put("success_time", result.successTime());
        return map;
    }

    private Map<String, Object> buildWxpayRefundResult(Order order, RefundResult result) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("order_id", order.getId());
        map.put("status", order.getStatus().name());
        map.put("wx_out_trade_no", order.getWxOutTradeNo());
        map.put("wx_refund_no", order.getWxRefundNo());
        map.put("refund_amount", order.getRefundAmount());
        map.put("refunded_at", order.getRefundedAt());
        map.put("refund_id", result.refundId());
        map.put("refund_status", result.status());
        map.put("refund_fen", result.refundFen());
        map.put("total_fen", result.totalFen());
        map.put("success_time", result.successTime());
        return map;
    }

    private String toAuditPayload(QueryOrderResult result) {
        return String.format("tradeState=%s,transactionId=%s,outTradeNo=%s,totalFen=%s,successTime=%s",
                result.tradeState(), result.transactionId(), result.outTradeNo(), result.totalFen(), result.successTime());
    }

    private String toAuditPayload(RefundResult result) {
        return String.format("status=%s,refundId=%s,outRefundNo=%s,refundFen=%s,totalFen=%s,successTime=%s",
                result.status(), result.refundId(), result.outRefundNo(), result.refundFen(), result.totalFen(), result.successTime());
    }

    private void saveWxpayAuditEvent(Order order, String processResult, String payload) {
        WebhookEvent event = new WebhookEvent();
        event.setEventId("wxpay_audit_" + order.getId() + "_" + processResult + "_" + System.nanoTime());
        event.setChannelCode("wxpay");
        event.setOrderId(order.getId());
        event.setPayload(payload);
        event.setProcessResult(processResult);
        webhookEventRepository.save(event);
    }

    private static String requireConfig(Map<String, String> cfg, String field, String channelCode) {
        String value = cfg.get(field);
        if (value == null || value.isBlank()) {
            throw new BusinessException(ErrorCode.CHANNEL_UNAVAILABLE,
                    "支付渠道 [" + channelCode + "] 缺少必填配置项: " + field + "，请在后台「支付渠道管理」中完善配置");
        }
        return value;
    }
}
