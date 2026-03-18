package com.orionkey.service;

import java.util.Map;

public interface CacheAdminService {

    Map<String, Object> getStatus();

    void setEnabled(boolean enabled);

    void clearAll();

    void clearModule(String module);
}

