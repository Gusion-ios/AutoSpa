package com.autospa.backend.vehicles;

import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/orders")
public class PublicOrderController {
    private final VehicleService vehicleService;

    public PublicOrderController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping("/{publicCode}")
    public PublicOrderStatus findStatus(@PathVariable UUID publicCode) {
        return vehicleService.findPublicStatus(publicCode);
    }
}
