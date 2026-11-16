package com.autospa.backend.oil;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.time.ZoneId;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OilChangeService {
    private final OilChangeRepository oilChanges;

    public OilChangeService(OilChangeRepository oilChanges) {
        this.oilChanges = oilChanges;
    }

    @Transactional(readOnly = true)
    public List<OilChange> findAll() {
        return oilChanges.findAllByOrderByNextDueDateAsc().stream()
                .map(OilChangeEntity::toRecord)
                .toList();
    }

    @Transactional
    public OilChange create(CreateOilChangeRequest request) {
        if (request == null) throw badRequest("Completa los datos del cambio de aceite.");
        required(request.client(), "El nombre del cliente es obligatorio.");
        String plate = required(request.plate(), "La placa es obligatoria.")
                .toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "");
        if (!plate.matches("[A-Z0-9]{6,7}")) throw badRequest("La placa debe tener entre 6 y 7 caracteres válidos.");
        required(request.vehicle(), "El vehículo es obligatorio.");
        required(request.oilBrand(), "La marca del aceite es obligatoria.");
        required(request.viscosity(), "La viscosidad es obligatoria.");
        if (request.liters() == null || request.liters().signum() <= 0) throw badRequest("Los litros deben ser mayores que cero.");
        if (request.mileage() == null || request.mileage() < 0) throw badRequest("El kilometraje actual no puede ser negativo.");
        if (request.nextMileage() == null || request.nextMileage() <= request.mileage()) throw badRequest("El próximo kilometraje debe ser mayor al actual.");
        if (request.nextDueDate() == null || request.nextDueDate().isBefore(LocalDate.now(ZoneId.of("America/Lima")))) throw badRequest("Indica una fecha de próximo cambio válida.");
        if (request.amount() == null || request.amount().signum() < 0) throw badRequest("El importe no puede ser negativo.");
        return oilChanges.save(new OilChangeEntity(request)).toRecord();
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) throw badRequest(message);
        return value.trim();
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
