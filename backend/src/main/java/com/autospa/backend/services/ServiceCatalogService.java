package com.autospa.backend.services;

import java.math.RoundingMode;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ServiceCatalogService {
    private final ServiceRepository repository;

    public ServiceCatalogService(ServiceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ServiceItem> findAll() {
        return repository.findAllByOrderByIdAsc().stream()
                .map(ServiceEntity::toItem)
                .toList();
    }

    public ServiceItem create(CreateServiceRequest request) {
        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debes enviar los datos del servicio."
            );
        }

        String name = request.name() == null ? "" : request.name().trim();

        if (name.length() < 3) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre debe tener al menos 3 caracteres."
            );
        }
        if (request.price() == null || request.price().signum() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El precio debe ser mayor que cero."
            );
        }
        if (request.duration() == null || request.duration() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La duración debe ser mayor que cero."
            );
        }
        if (repository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un servicio con ese nombre."
            );
        }

        var entity = new ServiceEntity(
                name,
                request.price().setScale(2, RoundingMode.HALF_UP),
                request.duration(),
                true
        );
        return repository.save(entity).toItem();
    }

    public ServiceItem updatePrice(long id, UpdateServicePriceRequest request) {
        if (request == null || request.price() == null || request.price().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio debe ser mayor que cero.");
        }
        ServiceEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el servicio."));
        entity.updatePrice(request.price().setScale(2, RoundingMode.HALF_UP));
        return repository.save(entity).toItem();
    }
}
