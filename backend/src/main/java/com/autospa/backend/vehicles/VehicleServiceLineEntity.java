package com.autospa.backend.vehicles;

import java.math.BigDecimal;
import com.autospa.backend.services.ServiceItem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "vehicle_service_lines")
public class VehicleServiceLineEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @Column(nullable = false)
    private long serviceId;

    @Column(nullable = false, length = 100)
    private String serviceName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal appliedPrice;

    @Column(nullable = false)
    private int duration;

    protected VehicleServiceLineEntity() {}

    public VehicleServiceLineEntity(VehicleEntity vehicle, ServiceItem service) {
        this.vehicle = vehicle;
        this.serviceId = service.id();
        this.serviceName = service.name();
        this.appliedPrice = service.price();
        this.duration = service.duration();
    }

    public AppliedService toAppliedService() {
        return new AppliedService(serviceId, serviceName, appliedPrice, duration);
    }
}
