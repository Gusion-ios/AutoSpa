package com.autospa.backend.vehicles;

import java.time.Instant;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.autospa.backend.services.ServiceItem;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "vehicles")
public class VehicleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant receivedAt;

    @Column(nullable = false, length = 120)
    private String client;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 7)
    private String plate;

    @Column(nullable = false, length = 120)
    private String vehicle;

    @Column(nullable = false, length = 100)
    private String service;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false)
    private boolean paid;

    @Column(length = 30)
    private String paymentMethod;

    private Instant paidAt;

    @Column(name = "public_code", updatable = false)
    private UUID publicCode;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<VehicleServiceLineEntity> services = new ArrayList<>();

    protected VehicleEntity() {}

    public VehicleEntity(Instant receivedAt, String client, String phone, String plate,
                         String vehicle, String service, String status) {
        this.receivedAt = receivedAt;
        this.client = client;
        this.phone = phone;
        this.plate = plate;
        this.vehicle = vehicle;
        this.service = service;
        this.status = status;
        this.paid = false;
        this.publicCode = UUID.randomUUID();
    }

    public Vehicle toVehicle() {
        List<AppliedService> appliedServices = services.stream()
                .map(VehicleServiceLineEntity::toAppliedService)
                .toList();
        BigDecimal total = appliedServices.stream()
                .map(AppliedService::appliedPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new Vehicle(id, receivedAt, client, phone, plate, vehicle, service,
                status, paid, paymentMethod, paidAt, appliedServices, total, publicCode);
    }

    public PublicOrderStatus toPublicOrderStatus() {
        return new PublicOrderStatus(publicCode, receivedAt,
                services.stream().map(line -> new PublicOrderService(line.toAppliedService().name())).toList(), status);
    }

    public void addService(ServiceItem serviceItem) {
        services.add(new VehicleServiceLineEntity(this, serviceItem));
    }

    public String getStatus() {
        return status;
    }

    public boolean isPaid() {
        return paid;
    }

    public void updateStatus(String status) {
        this.status = status;
    }

    public void registerPayment(String paymentMethod, Instant paidAt) {
        this.paid = true;
        this.paymentMethod = paymentMethod;
        this.paidAt = paidAt;
    }
}
