package com.autospa.backend.vehicles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record Vehicle(
        long id,
        Instant receivedAt,
        String client,
        String phone,
        String plate,
        String vehicle,
        String service,
        String status,
        boolean paid,
        String paymentMethod,
        Instant paidAt,
        List<AppliedService> services,
        BigDecimal total,
        UUID publicCode
) {}
