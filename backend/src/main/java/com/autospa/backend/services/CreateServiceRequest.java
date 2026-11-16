package com.autospa.backend.services;

import java.math.BigDecimal;

public record CreateServiceRequest(
        String name,
        BigDecimal price,
        Integer duration
) {}