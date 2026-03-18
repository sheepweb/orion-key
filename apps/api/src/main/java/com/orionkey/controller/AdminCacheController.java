package com.orionkey.controller;

import com.orionkey.annotation.LogOperation;
import com.orionkey.common.ApiResponse;
import com.orionkey.service.CacheAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/cache")
@RequiredArgsConstructor
public class AdminCacheController {

    private final CacheAdminService cacheAdminService;

    @GetMapping
    public ApiResponse<?> getStatus() {
        return ApiResponse.success(cacheAdminService.getStatus());
    }

    @LogOperation(action = "cache.toggle", targetType = "CACHE", detail = "'切换缓存开关'")
    @PostMapping("/toggle")
    public ApiResponse<Void> toggle(@RequestBody CacheToggleRequest request) {
        cacheAdminService.setEnabled(request.enabled());
        return ApiResponse.success();
    }

    @LogOperation(action = "cache.clear", targetType = "CACHE", detail = "'清理全部缓存'")
    @PostMapping("/clear-all")
    public ApiResponse<Void> clearAll() {
        cacheAdminService.clearAll();
        return ApiResponse.success();
    }

    @LogOperation(action = "cache.clear", targetType = "CACHE", targetId = "#module", detail = "'清理模块缓存'")
    @PostMapping("/clear/{module}")
    public ApiResponse<Void> clearModule(@PathVariable String module) {
        cacheAdminService.clearModule(module);
        return ApiResponse.success();
    }

    public record CacheToggleRequest(boolean enabled) {}
}

