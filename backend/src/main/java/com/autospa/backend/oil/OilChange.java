package com.autospa.backend.oil;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record OilChange(
        long id,
        String client,
        String plate,
        String vehicle,
        String oilBrand,
        String viscosity,
        BigDecimal liters,
        long mileage,
        long nextMileage,
        LocalDate nextDueDate,
        BigDecimal amount,
        Instant createdAt
) {}
