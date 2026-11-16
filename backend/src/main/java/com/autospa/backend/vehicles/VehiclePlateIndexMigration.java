package com.autospa.backend.vehicles;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class VehiclePlateIndexMigration implements ApplicationRunner {
    private final JdbcTemplate jdbc;

    public VehiclePlateIndexMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbc.execute("ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS uk_vehicles_plate");
        jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_vehicles_active_plate "
                + "ON vehicles (plate) WHERE status <> 'Entregado'");
        jdbc.execute("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS public_code UUID");
        jdbc.execute("UPDATE vehicles SET public_code = gen_random_uuid() WHERE public_code IS NULL");
        jdbc.execute("ALTER TABLE vehicles ALTER COLUMN public_code SET NOT NULL");
        jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_vehicles_public_code ON vehicles (public_code)");
    }
}
