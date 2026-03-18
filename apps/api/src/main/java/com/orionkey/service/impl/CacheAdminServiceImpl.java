package com.orionkey.service.impl;

import com.orionkey.config.CacheSwitchState;
import com.orionkey.constant.ErrorCode;
import com.orionkey.exception.BusinessException;
import com.orionkey.service.CacheAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CacheAdminServiceImpl implements CacheAdminService {

    private static final Map<String, List<String>> MODULE_CACHE_NAMES = Map.of(
            "site_config", List.of("sitePublicConfig", "siteConfigValue", "siteConfigInt"),
            "category", List.of("categoryList"),
            "product", List.of("productPublicList", "productDetail")
    );

    private final CacheManager cacheManager;
    private final CacheSwitchState cacheSwitchState;

    @Override
    public Map<String, Object> getStatus() {
        List<Map<String, Object>> modules = MODULE_CACHE_NAMES.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> module = new LinkedHashMap<>();
                    module.put("key", entry.getKey());
                    module.put("cache_names", entry.getValue());
                    return module;
                })
                .toList();
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("enabled", cacheSwitchState.isEnabled());
        status.put("modules", modules);
        return status;
    }

    @Override
    public void setEnabled(boolean enabled) {
        cacheSwitchState.setEnabled(enabled);
        clearAll();
    }

    @Override
    public void clearAll() {
        cacheManager.getCacheNames().forEach(this::clearCache);
    }

    @Override
    public void clearModule(String module) {
        List<String> cacheNames = MODULE_CACHE_NAMES.get(module);
        if (cacheNames == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的缓存模块: " + module);
        }
        cacheNames.forEach(this::clearCache);
    }

    private void clearCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
        }
    }
}

