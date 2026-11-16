package com.autospa.backend.oil;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateOilChangeRequest(
        String client,
        String plate,
        String vehicle,
        String oilBrand,
        String viscosity,
        BigDecimal liters,
        Long mileage,
        Long nextMileage,
        LocalDate nextDueDate,
        BigDecimal amount
) {}
