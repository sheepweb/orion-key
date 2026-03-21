package com.orionkey.service;

import com.orionkey.common.PageResult;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public interface AdminOrderService {

    PageResult<?> listOrders(String status, String orderType, String paymentMethod,
                             Boolean isRiskFlagged, String keyword, int page, int pageSize);

    Object getOrderDetail(UUID id);

    void markPaid(UUID id);

    Map<String, Object> queryWxpayOrder(UUID id);

    void closeWxpayOrder(UUID id);

    Map<String, Object> refundWxpayOrder(UUID id, BigDecimal refundAmount, String reason);

    Map<String, Object> queryWxpayRefund(UUID id);
}
