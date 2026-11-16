package com.autospa.backend.services;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {
    List<ServiceEntity> findAllByOrderByIdAsc();
    boolean existsByNameIgnoreCase(String name);
}
