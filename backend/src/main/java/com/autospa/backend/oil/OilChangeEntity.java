package com.autospa.backend.oil;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "oil_changes")
public class OilChangeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String client;

    @Column(nullable = false, length = 20)
    private String plate;

    @Column(nullable = false, length = 120)
    private String vehicle;

    @Column(nullable = false, length = 80)
    private String oilBrand;

    @Column(nullable = false, length = 20)
    private String viscosity;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal liters;

    @Column(nullable = false)
    private long mileage;

    @Column(nullable = false)
    private long nextMileage;

    @Column(nullable = false)
    private LocalDate nextDueDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private Instant createdAt;

    protected OilChangeEntity() {}

    public OilChangeEntity(CreateOilChangeRequest request) {
        this.client = request.client().trim();
        this.plate = request.plate().trim().toUpperCase().replaceAll("[\\s-]+", "");
        this.vehicle = request.vehicle().trim();
        this.oilBrand = request.oilBrand().trim();
        this.viscosity = request.viscosity().trim().toUpperCase();
        this.liters = request.liters();
        this.mileage = request.mileage();
        this.nextMileage = request.nextMileage();
        this.nextDueDate = request.nextDueDate();
        this.amount = request.amount();
        this.createdAt = Instant.now();
    }

    public OilChange toRecord() {
        return new OilChange(id, client, plate, vehicle, oilBrand, viscosity,
                liters, mileage, nextMileage, nextDueDate, amount, createdAt);
    }
}
