package com.orionkey.task;

import com.orionkey.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WxpayReconcileTask {

    private final PaymentService paymentService;

    @Scheduled(fixedDelayString = "${app.wxpay.reconcile-delay-ms:60000}", initialDelayString = "${app.wxpay.reconcile-initial-delay-ms:30000}")
    public void reconcilePendingOrders() {
        try {
            paymentService.reconcilePendingWxpayOrders();
        } catch (Exception e) {
            log.warn("Wxpay reconcile scheduled task failed", e);
        }
    }

    @Scheduled(fixedDelayString = "${app.wxpay.close-expired-delay-ms:120000}", initialDelayString = "${app.wxpay.close-expired-initial-delay-ms:45000}")
    public void closeExpiredOrders() {
        try {
            paymentService.closeExpiredWxpayOrders();
        } catch (Exception e) {
            log.warn("Wxpay close expired scheduled task failed", e);
        }
    }
}

