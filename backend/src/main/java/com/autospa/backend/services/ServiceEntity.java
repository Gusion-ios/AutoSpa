package com.autospa.backend.services;

import java.math.BigDecimal;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "service_catalog", uniqueConstraints = {
        @UniqueConstraint(name = "uk_service_catalog_name", columnNames = "name")
})
public class ServiceEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private int duration;

    @Column(nullable = false)
    private boolean active;

    protected ServiceEntity() {}

    public ServiceEntity(String name, BigDecimal price, int duration, boolean active) {
        this.name = name;
        this.price = price;
        this.duration = duration;
        this.active = active;
    }

    public ServiceItem toItem() {
        return new ServiceItem(id, name, price, duration, active);
    }

    public boolean isActive() {
        return active;
    }

    public void updatePrice(BigDecimal price) {
        this.price = price;
    }
}
