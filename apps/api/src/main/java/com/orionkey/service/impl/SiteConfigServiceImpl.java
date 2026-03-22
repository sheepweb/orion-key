package com.orionkey.service.impl;

import com.orionkey.entity.SiteConfig;
import com.orionkey.repository.SiteConfigRepository;
import com.orionkey.service.SiteConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class SiteConfigServiceImpl implements SiteConfigService {

    private static final String CACHE_PUBLIC_CONFIG = "sitePublicConfig";
    private static final String CACHE_CONFIG_VALUE = "siteConfigValue";
    private static final String CACHE_CONFIG_INT = "siteConfigInt";

    private final SiteConfigRepository siteConfigRepository;

    @org.springframework.beans.factory.annotation.Value("${turnstile.site-key:}")
    private String turnstileSiteKey;

    private static final Set<String> NUMERIC_KEYS = Set.of("points_rate");

    private static final List<String> PUBLIC_KEYS = List.of(
            "site_name", "site_slogan", "site_description", "logo_url", "favicon_url",
            "announcement_enabled", "announcement", "popup_enabled", "popup_content",
            "contact_email", "contact_telegram", "contact_telegram_group", "points_enabled", "points_rate",
            "maintenance_enabled", "maintenance_message", "footer_text", "github_url", "custom_css",
            "seo_default_title", "seo_default_description", "seo_default_keywords", "seo_og_title", "seo_og_description",
            "seo_og_image", "seo_title_template"
    );

    /** F16: 管理员允许编辑的配置键白名单 — 防止写入系统内部键或注入任意配置 */
    private static final Set<String> EDITABLE_KEYS = Set.of(
            // 站点基础
            "site_name", "site_slogan", "site_description", "logo_url", "favicon_url",
            // SEO
            "seo_default_title", "seo_default_description", "seo_default_keywords", "seo_og_title", "seo_og_description",
            "seo_og_image", "seo_title_template",
            // 公告 / 弹窗
            "announcement_enabled", "announcement", "popup_enabled", "popup_content",
            // 联系方式
            "contact_email", "contact_telegram", "contact_telegram_group",
            // 积分
            "points_enabled", "points_rate",
            // 维护模式
            "maintenance_enabled", "maintenance_message",
            // 页脚 / 外链
            "footer_text", "github_url",
            // 自定义样式
            "custom_css",
            // 系统参数
            "order_expire_minutes", "max_pending_orders_per_user", "max_pending_orders_per_ip",
            "rate_limit_per_second"
    );

    /** F15: CSS 危险模式 — 用于过滤 custom_css 中的 XSS 向量 */
    private static final Pattern CSS_DANGEROUS_PATTERNS = Pattern.compile(
            "(?i)(expression\\s*\\(|javascript\\s*:|@import\\s|\\\\00|behavior\\s*:|" +
            "-moz-binding\\s*:|url\\s*\\(\\s*[\"']?\\s*javascript)",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    @Cacheable(cacheNames = CACHE_PUBLIC_CONFIG, condition = "@cacheSwitchState.enabled")
    public Map<String, Object> getPublicConfig() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (String key : PUBLIC_KEYS) {
            siteConfigRepository.findByConfigKey(key).ifPresent(c -> result.put(key, convertConfigValue(key, c.getConfigValue())));
        }
        // F15: 对 custom_css 进行安全过滤，防止存储型 XSS
        if (result.containsKey("custom_css") && result.get("custom_css") instanceof String css) {
            result.put("custom_css", sanitizeCss(css));
        }
        // Turnstile Site Key：仅在后台开关启用时才返回给前端，确保前后端状态一致
        boolean turnstileEnabled = siteConfigRepository.findByConfigKey("turnstile_enabled")
                .map(c -> "true".equalsIgnoreCase(c.getConfigValue()))
                .orElse(false);
        if (turnstileEnabled && turnstileSiteKey != null && !turnstileSiteKey.isBlank()) {
            result.put("turnstile_site_key", turnstileSiteKey);
        }
        return result;
    }

    @Override
    @Cacheable(cacheNames = CACHE_CONFIG_VALUE, key = "#key", condition = "@cacheSwitchState.enabled")
    public String getConfigValue(String key) {
        return siteConfigRepository.findByConfigKey(key)
                .map(SiteConfig::getConfigValue)
                .orElse(null);
    }

    @Override
    @Cacheable(cacheNames = CACHE_CONFIG_INT, key = "#key", condition = "@cacheSwitchState.enabled")
    public int getConfigInt(String key, int defaultValue) {
        String value = getConfigValue(key);
        if (value == null) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    @Override
    public List<?> getAllConfigs() {
        return siteConfigRepository.findAll().stream()
                .map(c -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("config_key", c.getConfigKey());
                    map.put("config_value", c.getConfigValue());
                    map.put("config_group", c.getConfigGroup());
                    return map;
                }).toList();
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {CACHE_PUBLIC_CONFIG, CACHE_CONFIG_VALUE, CACHE_CONFIG_INT}, allEntries = true)
    public void updateConfigs(List<Map<String, String>> configs) {
        for (Map<String, String> item : configs) {
            String key = item.get("config_key");
            String value = item.get("config_value");
            // F16: 只允许白名单内的 key 被修改，防止注入系统内部配置
            if (key == null || !EDITABLE_KEYS.contains(key)) {
                log.warn("Rejected config update for non-editable key: {}", key);
                continue;
            }
            // F15: custom_css 写入时也做安全过滤
            if ("custom_css".equals(key) && value != null) {
                value = sanitizeCss(value);
            }
            SiteConfig config = siteConfigRepository.findByConfigKey(key)
                    .orElseGet(() -> {
                        SiteConfig c = new SiteConfig();
                        c.setConfigKey(key);
                        return c;
                    });
            config.setConfigValue(value);
            siteConfigRepository.save(config);
        }
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = {CACHE_PUBLIC_CONFIG, CACHE_CONFIG_VALUE, CACHE_CONFIG_INT}, allEntries = true)
    public void toggleMaintenance(boolean enabled) {
        SiteConfig config = siteConfigRepository.findByConfigKey("maintenance_enabled")
                .orElseGet(() -> {
                    SiteConfig c = new SiteConfig();
                    c.setConfigKey("maintenance_enabled");
                    c.setConfigGroup("site");
                    return c;
                });
        config.setConfigValue(String.valueOf(enabled));
        siteConfigRepository.save(config);
    }

    private Object convertConfigValue(String key, String value) {
        if (value == null) {
            return null;
        }
        if ("true".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value)) {
            return Boolean.parseBoolean(value);
        }
        if (NUMERIC_KEYS.contains(key)) {
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException e) {
                return value;
            }
        }
        return value;
    }

    /**
     * 过滤 CSS 中的危险内容，防止存储型 XSS。
     * 移除 HTML 标签和已知 CSS XSS 向量（expression/javascript:/behavior 等）。
     */
    private String sanitizeCss(String css) {
        if (css == null) return null;
        // 移除所有 HTML 标签（防止 </style><script>... 注入）
        css = css.replaceAll("<[^>]*>", "");
        // 移除危险 CSS 模式
        css = CSS_DANGEROUS_PATTERNS.matcher(css).replaceAll("/* blocked */");
        return css;
    }
}
