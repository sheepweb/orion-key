package com.orionkey;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class OrionKeyApplication {

    private static final TimeZone DEFAULT_TIME_ZONE = TimeZone.getTimeZone("Asia/Shanghai");

    public static void main(String[] args) {
        TimeZone.setDefault(DEFAULT_TIME_ZONE);
        SpringApplication.run(OrionKeyApplication.class, args);
    }
}
