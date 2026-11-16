package com.autospa.backend.vehicles;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public List<Vehicle> findAll() {
        return vehicleService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Vehicle create(@RequestBody CreateVehicleRequest request) {
        return vehicleService.create(request);
    }

    @PatchMapping("/{id}/status")
    public Vehicle updateStatus(@PathVariable long id, @RequestBody UpdateStatusRequest request) {
        return vehicleService.updateStatus(id, request);
    }

    @PostMapping("/{id}/payments")
    public Vehicle registerPayment(@PathVariable long id, @RequestBody PaymentRequest request) {
        return vehicleService.registerPayment(id, request);
    }

    @PostMapping("/{id}/delivery")
    public Vehicle markDelivered(@PathVariable long id) {
        return vehicleService.markDelivered(id);
    }
}
