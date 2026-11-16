package com.autospa.backend.vehicles;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.regex.Pattern;
import com.autospa.backend.services.ServiceRepository;
import com.autospa.backend.services.ServiceItem;
import com.autospa.backend.services.ServiceEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VehicleService {
    private static final Set<String> STATUSES = Set.of("Pendiente", "En proceso", "Listo");
    private static final Set<String> PAYMENT_METHODS = Set.of("Efectivo", "Tarjeta", "Yape / Plin");
    private static final Pattern PLATE_PATTERN = Pattern.compile("[A-Z0-9]{6,7}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(?:51)?9\\d{8}");

    private final VehicleRepository vehicles;
    private final ServiceRepository services;

    public VehicleService(VehicleRepository vehicles, ServiceRepository services) {
        this.vehicles = vehicles;
        this.services = services;
    }

    @Transactional(readOnly = true)
    public List<Vehicle> findAll() {
        return vehicles.findAllByOrderByReceivedAtDesc().stream()
                .map(VehicleEntity::toVehicle)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicOrderStatus findPublicStatus(UUID publicCode) {
        return vehicles.findByPublicCode(publicCode)
                .map(VehicleEntity::toPublicOrderStatus)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el seguimiento de esta orden."));
    }

    @Transactional
    public Vehicle create(CreateVehicleRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del vehículo son obligatorios.");
        }

        String client = required(request.client(), "El nombre del cliente es obligatorio.");
        String phone = digits(request.phone());
        String plate = normalizePlate(request.plate());
        String vehicleName = required(request.vehicle(), "La marca y modelo son obligatorios.");
        List<Long> requestedIds = request.serviceIds() == null ? List.of() : request.serviceIds();

        if (!PHONE_PATTERN.matcher(phone).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El teléfono debe ser un celular peruano válido.");
        }
        if (!PLATE_PATTERN.matcher(plate).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La placa no tiene un formato válido.");
        }
        if (vehicles.existsByPlateAndStatusNot(plate, "Entregado")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La placa ya tiene una visita abierta. Marca primero esa visita como Entregado.");
        }
        if (requestedIds.isEmpty()) {
            String legacyName = required(request.service(), "Selecciona al menos un servicio.");
            requestedIds = services.findAllByOrderByIdAsc().stream()
                    .filter(ServiceEntity::isActive)
                    .filter(item -> item.toItem().name().equalsIgnoreCase(legacyName))
                    .map(item -> item.toItem().id())
                    .toList();
        }
        if (requestedIds.isEmpty() || requestedIds.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona al menos un servicio válido.");
        }
        if (requestedIds.stream().distinct().count() != requestedIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No repitas servicios en el mismo ingreso.");
        }
        Map<Long, ServiceEntity> foundServices = services.findAllById(requestedIds).stream()
                .collect(Collectors.toMap(item -> item.toItem().id(), Function.identity()));
        if (foundServices.size() != requestedIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uno o más servicios no existen en el catálogo.");
        }
        List<ServiceItem> selectedServices = requestedIds.stream()
                .map(id -> foundServices.get(id))
                .peek(item -> {
                    if (!item.isActive()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede registrar un servicio inactivo.");
                    }
                })
                .map(ServiceEntity::toItem)
                .toList();

        String service = selectedServices.get(0).name();
        VehicleEntity entity = new VehicleEntity(Instant.now(), client, phone, plate,
                vehicleName, service, "Pendiente");
        selectedServices.forEach(entity::addService);
        return vehicles.save(entity).toVehicle();
    }

    @Transactional
    public Vehicle updateStatus(long id, UpdateStatusRequest request) {
        String status = request == null ? "" : required(request.status(), "El estado es obligatorio.");
        if (!STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido. Usa Pendiente, En proceso o Listo.");
        }

        VehicleEntity current = findById(id);
        if (current.isPaid() && !current.getStatus().equals(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede cambiar el estado de un vehículo pagado.");
        }
        current.updateStatus(status);
        return vehicles.save(current).toVehicle();
    }

    @Transactional
    public Vehicle markDelivered(long id) {
        VehicleEntity current = findById(id);
        if (!current.isPaid()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Registra el pago antes de entregar el vehículo.");
        }
        if (!"Listo".equals(current.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede entregar un vehículo que esté Listo.");
        }
        current.updateStatus("Entregado");
        return vehicles.save(current).toVehicle();
    }

    @Transactional
    public Vehicle registerPayment(long id, PaymentRequest request) {
        String method = request == null ? "" : required(request.paymentMethod(), "El método de pago es obligatorio.");
        if (!PAYMENT_METHODS.contains(method)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Método inválido. Usa Efectivo, Tarjeta o Yape / Plin.");
        }

        VehicleEntity current = findById(id);
        if (!"Listo".equals(current.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El vehículo debe estar Listo antes de cobrar.");
        }
        if (current.isPaid()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este servicio ya fue pagado.");
        }
        current.registerPayment(method, Instant.now());
        return vehicles.save(current).toVehicle();
    }

    private VehicleEntity findById(long id) {
        return vehicles.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el vehículo."));
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private static String normalizePlate(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "");
    }
}
