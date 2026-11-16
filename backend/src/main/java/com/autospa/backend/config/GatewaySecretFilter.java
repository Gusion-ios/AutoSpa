package com.autospa.backend.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

final class GatewaySecretFilter extends OncePerRequestFilter {
    private static final String HEADER_NAME = "X-Gateway-Secret";
    private final byte[] expectedSecret;

    GatewaySecretFilter(String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("AUTOSPA_GATEWAY_SECRET debe tener al menos 32 caracteres.");
        }
        this.expectedSecret = secret.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        byte[] suppliedSecret = request.getHeader(HEADER_NAME) == null
                ? new byte[0]
                : request.getHeader(HEADER_NAME).getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(expectedSecret, suppliedSecret)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Solicitud no autorizada por el gateway.");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
