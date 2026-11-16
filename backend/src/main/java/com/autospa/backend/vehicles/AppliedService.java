package com.autospa.backend.vehicles;

import java.math.BigDecimal;

public record AppliedService(long serviceId, String name, BigDecimal appliedPrice, int duration) {}
