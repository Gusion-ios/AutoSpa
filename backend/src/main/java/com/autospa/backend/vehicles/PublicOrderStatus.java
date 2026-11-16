package com.autospa.backend.vehicles;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PublicOrderStatus(
        UUID publicCode,
        Instant receivedAt,
        List<PublicOrderService> services,
        String status
) {}
