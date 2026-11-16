package com.autospa.backend.vehicles;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<VehicleEntity, Long> {
    List<VehicleEntity> findAllByOrderByReceivedAtDesc();
    boolean existsByPlateAndStatusNot(String plate, String status);
    Optional<VehicleEntity> findByPublicCode(UUID publicCode);
}
