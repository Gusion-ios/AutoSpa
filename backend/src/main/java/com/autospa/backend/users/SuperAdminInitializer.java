package com.autospa.backend.users;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Set;

@Component
public class SuperAdminInitializer implements ApplicationRunner {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String fullName;

    public SuperAdminInitializer(UserRepository users, PasswordEncoder passwordEncoder,
                                 @Value("${autospa.superadmin.email:}") String email,
                                 @Value("${autospa.superadmin.password:}") String password,
                                 @Value("${autospa.superadmin.name:Administrador Supremo}") String fullName) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.count() > 0) return;
        if (email.isBlank() || password.isBlank()) {
            throw new IllegalStateException("Configura AUTOSPA_SUPERADMIN_EMAIL y AUTOSPA_SUPERADMIN_PASSWORD para crear la cuenta inicial.");
        }
        UserService.validatePassword(password);
        String normalizedEmail = email.trim().toLowerCase();
        users.save(new UserEntity(fullName.trim(), normalizedEmail, passwordEncoder.encode(password), Set.of(UserRole.ADMIN_SUPREMO), true));
    }
}
