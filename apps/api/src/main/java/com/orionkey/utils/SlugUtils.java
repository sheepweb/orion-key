package com.orionkey.utils;

import java.util.Locale;

public final class SlugUtils {

    private SlugUtils() {}

    public static String slugify(String input) {
        if (input == null) {
            return "";
        }

        String slug = input.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");

        return slug;
    }
}

