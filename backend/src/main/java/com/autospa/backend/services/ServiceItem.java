package com.autospa.backend.services;

import java.math.BigDecimal;

public record ServiceItem(
        long id,
        String name,
        BigDecimal price,
        int duration,
        boolean active
) {}