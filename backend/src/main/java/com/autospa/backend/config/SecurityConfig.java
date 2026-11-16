package com.autospa.backend.config;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import com.autospa.backend.users.UserRepository;
import com.autospa.backend.users.UserEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    SecretKey jwtSecretKey(@Value("${autospa.jwt.secret:}") String secret) {
        if (secret.length() < 32) throw new IllegalStateException("AUTOSPA_JWT_SECRET debe tener al menos 32 caracteres.");
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey key) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey key) {
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter(UserRepository users) {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            UserEntity user = users.findByEmailIgnoreCase(jwt.getSubject())
                    .filter(UserEntity::isActive)
                    .orElseThrow(() -> new org.springframework.security.oauth2.server.resource.InvalidBearerTokenException("La cuenta ya no está activa."));
            return user.getRoles().stream()
                    .map(role -> (org.springframework.security.core.GrantedAuthority)
                            new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role.name()))
                    .collect(java.util.stream.Collectors.toList());
        });
        return converter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter converter,
            @Value("${autospa.gateway.secret:}") String gatewaySecret) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/public/orders/*").permitAll()
                        .requestMatchers("/api/auth/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/services").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/services").hasAnyRole("ADMIN_SUPREMO", "ADMINISTRADOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/services/*/price").hasAnyRole("ADMIN_SUPREMO", "ADMINISTRADOR")
                        .requestMatchers(HttpMethod.GET, "/api/vehicles").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/vehicles").hasAnyRole("ADMIN_SUPREMO", "ADMINISTRADOR", "RECEPCION")
                        .requestMatchers(HttpMethod.PATCH, "/api/vehicles/*/status").hasAnyRole("ADMIN_SUPREMO", "ADMINISTRADOR", "TECNICO")
                        .requestMatchers(HttpMethod.POST, "/api/vehicles/*/payments").hasAnyRole("ADMIN_SUPREMO", "ADMINISTRADOR", "CAJA")
                        .requestMatchers(HttpMethod.POST, "/api/vehicles/*/delivery").hasAnyRole("ADMIN_SUPREMO", "ADMINISTRADOR", "CAJA", "RECEPCION")
                        .requestMatchers(HttpMethod.GET, "/api/oil-changes").hasAnyRole("ADMIN_SUPREMO", "ADMINISTRADOR", "RECEPCION", "TECNICO")
                        .requestMatchers(HttpMethod.POST, "/api/oil-changes").hasAnyRole("ADMIN_SUPREMO", "ADMINISTRADOR", "RECEPCION", "TECNICO")
                        .requestMatchers("/api/users/**").hasAnyRole("ADMIN_SUPREMO", "ADMINISTRADOR")
                        .anyRequest().denyAll())
                .oauth2ResourceServer(resource -> resource.jwt(jwt -> jwt.jwtAuthenticationConverter(converter)))
                .addFilterBefore(new GatewaySecretFilter(gatewaySecret), BearerTokenAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    org.springframework.security.core.userdetails.UserDetailsService userDetailsService(UserRepository users) {
        return username -> users.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("Cuenta no encontrada."));
    }
}
