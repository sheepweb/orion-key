package com.orionkey.controller;

import com.orionkey.annotation.LogOperation;
import com.orionkey.common.ApiResponse;
import com.orionkey.service.AdminOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    @GetMapping
    public ApiResponse<?> listOrders(
            @RequestParam(required = false) String status,
            @RequestParam(value = "order_type", required = false) String orderType,
            @RequestParam(value = "payment_method", required = false) String paymentMethod,
            @RequestParam(value = "is_risk_flagged", required = false) Boolean isRiskFlagged,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(value = "page_size", defaultValue = "20") int pageSize) {
        return ApiResponse.success(adminOrderService.listOrders(status, orderType, paymentMethod,
                isRiskFlagged, keyword, page, pageSize));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getOrderDetail(@PathVariable UUID id) {
        return ApiResponse.success(adminOrderService.getOrderDetail(id));
    }

    @LogOperation(action = "order.mark_paid", targetType = "ORDER", targetId = "#id", detail = "'手动标记已付'")
    @PostMapping("/{id}/mark-paid")
    public ApiResponse<Void> markPaid(@PathVariable UUID id) {
        adminOrderService.markPaid(id);
        return ApiResponse.success();
    }

    @LogOperation(action = "order.wxpay_query", targetType = "ORDER", targetId = "#id", detail = "'微信查单'")
    @PostMapping("/{id}/wxpay/query")
    public ApiResponse<?> queryWxpayOrder(@PathVariable UUID id) {
        return ApiResponse.success(adminOrderService.queryWxpayOrder(id));
    }

    @LogOperation(action = "order.wxpay_close", targetType = "ORDER", targetId = "#id", detail = "'关闭微信订单'")
    @PostMapping("/{id}/wxpay/close")
    public ApiResponse<Void> closeWxpayOrder(@PathVariable UUID id) {
        adminOrderService.closeWxpayOrder(id);
        return ApiResponse.success();
    }

    @LogOperation(action = "order.wxpay_refund", targetType = "ORDER", targetId = "#id", detail = "'发起微信退款'")
    @PostMapping("/{id}/wxpay/refund")
    public ApiResponse<?> refundWxpayOrder(@PathVariable UUID id, @RequestBody(required = false) Map<String, Object> body) {
        BigDecimal refundAmount = null;
        String reason = null;
        if (body != null) {
            Object refundAmountValue = body.get("refund_amount");
            if (refundAmountValue != null && !refundAmountValue.toString().isBlank()) {
                refundAmount = new BigDecimal(refundAmountValue.toString());
            }
            Object reasonValue = body.get("reason");
            if (reasonValue != null) {
                reason = reasonValue.toString();
            }
        }
        return ApiResponse.success(adminOrderService.refundWxpayOrder(id, refundAmount, reason));
    }

    @GetMapping("/{id}/wxpay/refund-status")
    public ApiResponse<?> queryWxpayRefund(@PathVariable UUID id) {
        return ApiResponse.success(adminOrderService.queryWxpayRefund(id));
    }
}
