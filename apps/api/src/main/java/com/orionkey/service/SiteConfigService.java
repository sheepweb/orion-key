package com.orionkey.service;

import java.util.List;
import java.util.Map;

public interface SiteConfigService {

    Map<String, Object> getPublicConfig();

    String getConfigValue(String key);

    int getConfigInt(String key, int defaultValue);

    List<?> getAllConfigs();

    void updateConfigs(List<Map<String, String>> configs);

    void toggleMaintenance(boolean enabled);
}
