package com.autospa.backend.oil;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OilChangeRepository extends JpaRepository<OilChangeEntity, Long> {
    List<OilChangeEntity> findAllByOrderByNextDueDateAsc();
}
