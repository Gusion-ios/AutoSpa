package com.autospa.backend.services;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class ServiceCatalogInitializer implements ApplicationRunner {
    private final ServiceRepository repository;

    public ServiceCatalogInitializer(ServiceRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() == 0) {
            repository.saveAll(List.of(
                    new ServiceEntity("Lavado completo", new BigDecimal("45.00"), 45, true),
                    new ServiceEntity("Lavado premium", new BigDecimal("70.00"), 60, true),
                    new ServiceEntity("Encerado", new BigDecimal("95.00"), 90, true),
                    new ServiceEntity("Limpieza interior", new BigDecimal("60.00"), 60, true)
            ));
        }
    }
}
