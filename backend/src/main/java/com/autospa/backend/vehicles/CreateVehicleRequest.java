package com.autospa.backend.vehicles;

import java.util.List;

public record CreateVehicleRequest(
        String client,
        String phone,
        String plate,
        String vehicle,
        String service,
        List<Long> serviceIds
) {}
