package com.orionkey.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cache.annotation.EnableCaching;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${app.cache.site-config-seconds:300}")
    private long siteConfigSeconds;

    @Value("${app.cache.config-value-seconds:300}")
    private long configValueSeconds;

    @Value("${app.cache.category-seconds:600}")
    private long categorySeconds;

    @Value("${app.cache.product-list-seconds:60}")
    private long productListSeconds;

    @Value("${app.cache.product-detail-seconds:60}")
    private long productDetailSeconds;

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                buildCache("sitePublicConfig", 10, siteConfigSeconds),
                buildCache("siteConfigValue", 100, configValueSeconds),
                buildCache("siteConfigInt", 100, configValueSeconds),
                buildCache("categoryList", 20, categorySeconds),
                buildCache("productPublicList", 200, productListSeconds),
                buildCache("productDetail", 500, productDetailSeconds)
        ));
        return manager;
    }

    private CaffeineCache buildCache(String name, long maximumSize, long ttlSeconds) {
        return new CaffeineCache(name, Caffeine.newBuilder()
                .maximumSize(maximumSize)
                .expireAfterWrite(ttlSeconds, TimeUnit.SECONDS)
                .build());
    }
}

