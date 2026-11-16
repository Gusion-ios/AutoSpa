package com.autospa.backend.services;

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
@RequestMapping("/api/services")
public class ServiceCatalogController {
    private final ServiceCatalogService serviceCatalog;

    public ServiceCatalogController(ServiceCatalogService serviceCatalog) {
        this.serviceCatalog = serviceCatalog;
    }

    @GetMapping
    public List<ServiceItem> findAll() {
        return serviceCatalog.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceItem create(@RequestBody CreateServiceRequest request) {
        return serviceCatalog.create(request);
    }

    @PatchMapping("/{id}/price")
    public ServiceItem updatePrice(@PathVariable long id, @RequestBody UpdateServicePriceRequest request) {
        return serviceCatalog.updatePrice(id, request);
    }
}
